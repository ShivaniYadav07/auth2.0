import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { listOAuthClients, registerOAuthClient } from '../api/oauthClientApi';
import { clientFormSchema } from '../schemas/clientSchemas';
import { getErrorMessage } from '../utils/apiError';
import { SUPPORTED_SCOPES, DEFAULT_SCOPE } from '../utils/oauthConstants';
import { getDemoClientSecret, saveDemoClientSecret, savePendingAuthFlow } from '../utils/demoStorage';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

const labelCls = 'mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100';
const fieldCls = 'mb-4 text-left';
const errorCls = 'mt-1 text-xs text-red-500';
const hintCls = 'mt-1 text-xs text-gray-500';
const tokenBoxCls = 'mb-2.5 break-all rounded-md bg-gray-100 p-3 text-left text-xs dark:bg-gray-800';
const scopeBadgeCls =
  'mr-1.5 inline-block rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-600 dark:text-violet-400';

const defaultRedirectUri = `${window.location.origin}/oauth/callback`;

export default function OAuthClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [newlyCreated, setNewlyCreated] = useState(null);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { name: '', redirectUris: defaultRedirectUri, scopes: [DEFAULT_SCOPE] },
  });

  const loadClients = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const data = await listOAuthClients();
      setClients(data);
    } catch (err) {
      setListError(getErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function onSubmit(values) {
    setServerError('');
    setNewlyCreated(null);
    try {
      const { client, clientSecret } = await registerOAuthClient(values);
      saveDemoClientSecret(client.clientId, clientSecret);
      setNewlyCreated({ client, clientSecret });
      reset({ name: '', redirectUris: defaultRedirectUri, scopes: [DEFAULT_SCOPE] });
      loadClients();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  function startAuthorization(client) {
    const clientSecret = getDemoClientSecret(client.clientId);
    const redirectUri = client.redirectUris[0];
    const scope = client.scopes.length > 0 ? client.scopes.join(' ') : DEFAULT_SCOPE;
    const state = crypto.randomUUID();

    savePendingAuthFlow({ clientId: client.clientId, clientSecret, redirectUri });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: client.clientId,
      redirect_uri: redirectUri,
      scope,
      state,
    });
    navigate(`/oauth/authorize?${params.toString()}`);
  }

  return (
    <main className="mx-auto w-full max-w-[960px] flex-1 px-6 py-10">
      <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">OAuth clients</h1>
      <p className="text-sm text-gray-500">
        Register a third-party application that will use this server for the Authorization Code
        Flow.
      </p>

      <Card title="Register a new client" className="mt-6">
        <Alert>{serverError}</Alert>

        {newlyCreated && (
          <Alert variant="success">
            <strong>{newlyCreated.client.name}</strong> registered. Copy the client secret now - it
            will not be shown again. It has also been saved to this browser's local storage so this
            demo can complete the token exchange step.
            <div className={`${tokenBoxCls} mt-2.5`}>
              client_id: {newlyCreated.client.clientId}
              <br />
              client_secret: {newlyCreated.clientSecret}
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={fieldCls}>
            <label htmlFor="name" className={labelCls}>
              Client name
            </label>
            <Input id="name" type="text" hasError={!!errors.name} {...register('name')} />
            {errors.name && <p className={errorCls}>{errors.name.message}</p>}
          </div>

          <div className={fieldCls}>
            <label htmlFor="redirectUris" className={labelCls}>
              Redirect URIs (one per line)
            </label>
            <Input as="textarea" id="redirectUris" hasError={!!errors.redirectUris} {...register('redirectUris')} />
            {errors.redirectUris && <p className={errorCls}>{errors.redirectUris.message}</p>}
            <p className={hintCls}>
              Defaults to this app's own callback route so the demo can complete the flow end to end.
            </p>
          </div>

          <div className={fieldCls}>
            <span className={labelCls}>Scopes</span>
            <div className="flex flex-wrap gap-4">
              {SUPPORTED_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <input type="checkbox" value={scope} {...register('scopes')} />
                  {scope}
                </label>
              ))}
            </div>
            {errors.scopes && <p className={errorCls}>{errors.scopes.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering…' : 'Register client'}
          </Button>
        </form>
      </Card>

      <Card title="Your clients">
        {listLoading && <Spinner />}
        <Alert>{listError}</Alert>

        {!listLoading && !listError && clients.length === 0 && (
          <p className="text-sm text-gray-500">No OAuth clients registered yet.</p>
        )}

        {!listLoading && clients.length > 0 && (
          <ul className="m-0 list-none p-0 text-left">
            {clients.map((client) => {
              const hasSecret = Boolean(getDemoClientSecret(client.clientId));
              return (
                <li
                  key={client.clientId}
                  className="mb-2.5 rounded-lg border border-gray-200 p-3.5 dark:border-gray-800"
                >
                  <strong className="text-gray-900 dark:text-gray-100">{client.name}</strong>{' '}
                  <span className="text-sm text-gray-500">({client.clientId})</span>
                  <div className="my-1.5 text-sm text-gray-500">
                    Redirect URIs: {client.redirectUris.join(', ')}
                  </div>
                  <div className="mb-2.5">
                    {client.scopes.length === 0 ? (
                      <span className={scopeBadgeCls}>{DEFAULT_SCOPE} (default)</span>
                    ) : (
                      client.scopes.map((s) => (
                        <span className={scopeBadgeCls} key={s}>
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                  <Button
                    type="button"
                    disabled={!hasSecret}
                    onClick={() => startAuthorization(client)}
                    title={
                      hasSecret
                        ? undefined
                        : 'Client secret not available in this browser - register a new client to run the full demo'
                    }
                  >
                    Start authorization
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}

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
import Spinner from '../components/ui/Spinner';

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
    <main className="wide">
      <h1>OAuth clients</h1>
      <p className="muted">
        Register a third-party application that will use this server for the
        Authorization Code Flow.
      </p>

      <Card title="Register a new client">
        <Alert>{serverError}</Alert>

        {newlyCreated && (
          <Alert variant="success">
            <strong>{newlyCreated.client.name}</strong> registered. Copy the client
            secret now - it will not be shown again. It has also been saved to this
            browser's local storage so this demo can complete the token exchange step.
            <div className="token-box" style={{ marginTop: 10 }}>
              client_id: {newlyCreated.client.clientId}
              <br />
              client_secret: {newlyCreated.clientSecret}
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-field">
            <label htmlFor="name">Client name</label>
            <input id="name" type="text" {...register('name')} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="redirectUris">Redirect URIs (one per line)</label>
            <textarea id="redirectUris" {...register('redirectUris')} />
            {errors.redirectUris && <p className="form-error">{errors.redirectUris.message}</p>}
            <p className="form-hint">
              Defaults to this app's own callback route so the demo can complete the
              flow end to end.
            </p>
          </div>

          <div className="form-field">
            <label>Scopes</label>
            <div className="checkbox-group">
              {SUPPORTED_SCOPES.map((scope) => (
                <label key={scope}>
                  <input type="checkbox" value={scope} {...register('scopes')} />
                  {scope}
                </label>
              ))}
            </div>
            {errors.scopes && <p className="form-error">{errors.scopes.message}</p>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Registering…' : 'Register client'}
          </button>
        </form>
      </Card>

      <Card title="Your clients">
        {listLoading && <Spinner />}
        <Alert>{listError}</Alert>

        {!listLoading && !listError && clients.length === 0 && (
          <p className="muted">No OAuth clients registered yet.</p>
        )}

        {!listLoading && clients.length > 0 && (
          <ul className="client-list">
            {clients.map((client) => {
              const hasSecret = Boolean(getDemoClientSecret(client.clientId));
              return (
                <li key={client.clientId}>
                  <strong>{client.name}</strong> <span className="muted">({client.clientId})</span>
                  <div className="muted" style={{ margin: '6px 0' }}>
                    Redirect URIs: {client.redirectUris.join(', ')}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    {client.scopes.length === 0 ? (
                      <span className="scope-badge">{DEFAULT_SCOPE} (default)</span>
                    ) : (
                      client.scopes.map((s) => (
                        <span className="scope-badge" key={s}>
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!hasSecret}
                    onClick={() => startAuthorization(client)}
                    title={
                      hasSecret
                        ? undefined
                        : 'Client secret not available in this browser - register a new client to run the full demo'
                    }
                  >
                    Start authorization
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}

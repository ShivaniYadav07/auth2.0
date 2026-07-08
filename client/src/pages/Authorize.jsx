import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAuthorizationRequest, submitAuthorizationDecision } from '../api/oauthApi';
import { getErrorMessage } from '../utils/apiError';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const scopeBadgeCls =
  'mr-1.5 inline-block rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-600 dark:text-violet-400';

export default function Authorize() {
  const [searchParams] = useSearchParams();
  const requestParams = {
    response_type: searchParams.get('response_type'),
    client_id: searchParams.get('client_id'),
    redirect_uri: searchParams.get('redirect_uri'),
    scope: searchParams.get('scope') || undefined,
    state: searchParams.get('state') || undefined,
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function validate() {
      setLoading(true);
      setError('');
      try {
        const data = await getAuthorizationRequest(requestParams);
        if (!cancelled) setConsent(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (requestParams.response_type && requestParams.client_id && requestParams.redirect_uri) {
      validate();
    } else {
      setLoading(false);
      setError('This authorization request is missing required parameters.');
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function decide(decision) {
    setDeciding(true);
    setError('');
    try {
      const { redirectUrl } = await submitAuthorizationDecision({
        ...requestParams,
        scope: consent.scope,
        decision,
      });
      // Mirrors what a real consent frontend does per the backend docs: the API
      // returns the redirect URL rather than issuing an HTTP redirect itself, and the
      // frontend performs the actual browser navigation.
      window.location.href = redirectUrl;
    } catch (err) {
      setError(getErrorMessage(err));
      setDeciding(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
        <div className="flex flex-1 items-center justify-center">
          <Spinner label="Validating authorization request…" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
        <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">
          Authorization request
        </h1>
        <Alert>{error}</Alert>
      </main>
    );
  }

  const scopes = consent.scope ? consent.scope.split(' ') : [];

  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
      <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">
        Authorize application
      </h1>
      <Card>
        <p className="text-gray-700 dark:text-gray-300">
          <strong>{consent.client.name}</strong> is requesting access to your account.
        </p>
        <p className="text-sm text-gray-500">Client ID: {consent.client.clientId}</p>
        <div className="my-4">
          <p className="mb-2 text-sm text-gray-500">This application will be able to:</p>
          {scopes.map((scope) => (
            <span className={scopeBadgeCls} key={scope}>
              {scope}
            </span>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <Button type="button" disabled={deciding} onClick={() => decide('allow')}>
            Allow
          </Button>
          <Button type="button" variant="secondary" disabled={deciding} onClick={() => decide('deny')}>
            Deny
          </Button>
        </div>
      </Card>
    </main>
  );
}

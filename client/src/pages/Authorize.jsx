import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAuthorizationRequest, submitAuthorizationDecision } from '../api/oauthApi';
import { getErrorMessage } from '../utils/apiError';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';

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
      <main>
        <div className="page-center">
          <Spinner label="Validating authorization request…" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Authorization request</h1>
        <Alert>{error}</Alert>
      </main>
    );
  }

  const scopes = consent.scope ? consent.scope.split(' ') : [];

  return (
    <main>
      <h1>Authorize application</h1>
      <Card>
        <p>
          <strong>{consent.client.name}</strong> is requesting access to your account.
        </p>
        <p className="muted">Client ID: {consent.client.clientId}</p>
        <div style={{ margin: '16px 0' }}>
          <p className="muted" style={{ marginBottom: 8 }}>
            This application will be able to:
          </p>
          {scopes.map((scope) => (
            <span className="scope-badge" key={scope}>
              {scope}
            </span>
          ))}
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={deciding}
            onClick={() => decide('allow')}
          >
            Allow
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={deciding}
            onClick={() => decide('deny')}
          >
            Deny
          </button>
        </div>
      </Card>
    </main>
  );
}

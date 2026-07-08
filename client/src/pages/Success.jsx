import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../api/userApi';
import { getErrorMessage } from '../utils/apiError';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const dlCls = 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-left text-sm';
const dtCls = 'text-gray-500';
const ddCls = 'm-0 break-all text-gray-900 dark:text-gray-100';
const hintCls = 'mt-3 text-xs text-gray-500';
const tokenBoxCls = 'mb-2.5 break-all rounded-md bg-gray-100 p-3 text-left text-xs dark:bg-gray-800';

export default function Success() {
  const location = useLocation();
  const tokenResponse = location.state?.tokenResponse;

  const [calling, setCalling] = useState(false);
  const [callError, setCallError] = useState('');
  const [protectedResult, setProtectedResult] = useState(null);

  if (!tokenResponse) {
    return (
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
        <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">No token data</h1>
        <p className="mb-5 text-sm text-gray-500">
          This page expects to receive a token response from the OAuth callback step.
        </p>
        <Link className="no-underline" to="/oauth/clients">
          <Button>Back to OAuth clients</Button>
        </Link>
      </main>
    );
  }

  async function callProtectedEndpoint() {
    setCalling(true);
    setCallError('');
    setProtectedResult(null);
    try {
      const user = await getCurrentUser(tokenResponse.access_token);
      setProtectedResult(user);
    } catch (err) {
      setCallError(getErrorMessage(err));
    } finally {
      setCalling(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
      <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">
        Authorization complete
      </h1>
      <Alert variant="success">
        The authorization code was exchanged for an access token successfully.
      </Alert>

      <Card title="Token response">
        <dl className={dlCls}>
          <dt className={dtCls}>Token type</dt>
          <dd className={ddCls}>{tokenResponse.token_type}</dd>
          <dt className={dtCls}>Expires in</dt>
          <dd className={ddCls}>{tokenResponse.expires_in} seconds</dd>
          <dt className={dtCls}>Scope</dt>
          <dd className={ddCls}>{tokenResponse.scope}</dd>
        </dl>
        <p className={hintCls}>access_token</p>
        <div className={tokenBoxCls}>{tokenResponse.access_token}</div>
        <p className={hintCls}>refresh_token</p>
        <div className={tokenBoxCls}>{tokenResponse.refresh_token}</div>
      </Card>

      <Card title="Demo: call a protected endpoint">
        <p className="text-sm text-gray-500">
          Use the access token above to call{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
            GET /users/me
          </code>{' '}
          as this OAuth client would.
        </p>
        <div className="mt-4">
          <Button type="button" onClick={callProtectedEndpoint} disabled={calling}>
            {calling ? 'Calling…' : 'Call GET /users/me'}
          </Button>
        </div>

        {calling && (
          <div className="mt-3">
            <Spinner label="Calling protected endpoint…" />
          </div>
        )}
        <div className="mt-3">
          <Alert>{callError}</Alert>
        </div>

        {protectedResult && (
          <pre className={`${tokenBoxCls} mt-3 whitespace-pre-wrap`}>
            {JSON.stringify(protectedResult, null, 2)}
          </pre>
        )}
      </Card>

      <Link className="no-underline" to="/oauth/clients">
        <Button variant="secondary">Back to OAuth clients</Button>
      </Link>
    </main>
  );
}

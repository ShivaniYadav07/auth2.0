import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeToken } from '../api/oauthApi';
import { getErrorMessage } from '../utils/apiError';
import { clearPendingAuthFlow, getPendingAuthFlow } from '../utils/demoStorage';
import Spinner from '../components/ui/Spinner';

// This is the redirect_uri the demo OAuth clients register. In a real integration this
// route would live on the third-party app's own domain/backend; here it lives in the
// same SPA purely so the whole flow can be demonstrated without a second running app.
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    // The authorization code is single-use; guard against StrictMode's double effect
    // invocation in dev, which would otherwise burn the code on a harmless duplicate call.
    if (hasRun.current) return;
    hasRun.current = true;

    const error = searchParams.get('error');
    const code = searchParams.get('code');

    if (error) {
      navigate('/error', {
        replace: true,
        state: { title: 'Authorization denied', message: error },
      });
      return;
    }

    if (!code) {
      navigate('/error', {
        replace: true,
        state: { title: 'Invalid callback', message: 'No authorization code was returned.' },
      });
      return;
    }

    const pending = getPendingAuthFlow();
    if (!pending?.clientSecret) {
      navigate('/error', {
        replace: true,
        state: {
          title: 'Cannot complete demo token exchange',
          message:
            'No client secret was found for this flow in this browser. Start the authorization flow again from the OAuth clients page.',
        },
      });
      return;
    }

    exchangeToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: pending.redirectUri,
      client_id: pending.clientId,
      client_secret: pending.clientSecret,
    })
      .then((tokenResponse) => {
        clearPendingAuthFlow();
        navigate('/success', { replace: true, state: { tokenResponse } });
      })
      .catch((err) => {
        navigate('/error', {
          replace: true,
          state: { title: 'Token exchange failed', message: getErrorMessage(err) },
        });
      });
  }, [searchParams, navigate]);

  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
      <div className="flex flex-1 items-center justify-center">
        <Spinner label="Exchanging authorization code for tokens…" />
      </div>
    </main>
  );
}

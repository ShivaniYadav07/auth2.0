import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="text-center">
      <h1>OAuth 2.0 Authorization Server Demo</h1>
      <p className="muted">
        A lightweight client demonstrating the Authorization Code Flow against the
        included Node/Express OAuth 2.0 server: register a user, register an OAuth
        client, run the authorize + consent flow, and exchange a code for tokens.
      </p>
      <div className="btn-row" style={{ justifyContent: 'center' }}>
        {isAuthenticated ? (
          <Link className="btn btn-primary" to="/dashboard">
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link className="btn btn-primary" to="/register">
              Get started
            </Link>
            <Link className="btn btn-secondary" to="/login">
              Log in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

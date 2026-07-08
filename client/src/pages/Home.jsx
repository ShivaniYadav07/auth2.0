import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10 text-center">
      <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">
        OAuth 2.0 Authorization Server Demo
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        A lightweight client demonstrating the Authorization Code Flow against the included
        Node/Express OAuth 2.0 server: register a user, register an OAuth client, run the
        authorize + consent flow, and exchange a code for tokens.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        {isAuthenticated ? (
          <Link className="no-underline" to="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
        ) : (
          <>
            <Link className="no-underline" to="/register">
              <Button>Get started</Button>
            </Link>
            <Link className="no-underline" to="/login">
              <Button variant="secondary">Log in</Button>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

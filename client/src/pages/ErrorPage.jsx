import { Link, useLocation } from 'react-router-dom';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';

export default function ErrorPage() {
  const location = useLocation();
  const title = location.state?.title ?? 'Something went wrong';
  const message = location.state?.message ?? 'An unexpected error occurred.';

  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
      <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      <Alert>{message}</Alert>
      <div className="mt-5 flex gap-3">
        <Link className="no-underline" to="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
        <Link className="no-underline" to="/oauth/clients">
          <Button variant="secondary">OAuth clients</Button>
        </Link>
      </div>
    </main>
  );
}

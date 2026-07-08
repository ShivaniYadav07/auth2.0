import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10 text-center">
      <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">
        404 - Page not found
      </h1>
      <p className="mb-5 text-sm text-gray-500">The page you're looking for doesn't exist.</p>
      <Link className="no-underline" to="/">
        <Button>Go home</Button>
      </Link>
    </main>
  );
}

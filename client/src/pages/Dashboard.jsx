import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const dlCls = 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-left text-sm';
const dtCls = 'text-gray-500';
const ddCls = 'm-0 break-all text-gray-900 dark:text-gray-100';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-10">
      <h1 className="my-8 text-4xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>

      <Card title="Signed in as">
        <dl className={dlCls}>
          <dt className={dtCls}>Name</dt>
          <dd className={ddCls}>{user.name}</dd>
          <dt className={dtCls}>Email</dt>
          <dd className={ddCls}>{user.email}</dd>
          <dt className={dtCls}>User ID</dt>
          <dd className={ddCls}>{user._id}</dd>
        </dl>
      </Card>

      <Card title="Try the OAuth 2.0 flow">
        <p className="text-sm text-gray-500">
          Register a third-party OAuth client, then walk through authorization, consent, and
          token exchange end to end.
        </p>
        <div className="mt-5 flex gap-3">
          <Link className="no-underline" to="/oauth/clients">
            <Button>Manage OAuth clients</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

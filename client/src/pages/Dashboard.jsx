import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <main>
      <h1>Dashboard</h1>

      <Card title="Signed in as">
        <dl className="kv-list">
          <dt>Name</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>User ID</dt>
          <dd>{user._id}</dd>
        </dl>
      </Card>

      <Card title="Try the OAuth 2.0 flow">
        <p className="muted">
          Register a third-party OAuth client, then walk through authorization,
          consent, and token exchange end to end.
        </p>
        <div className="btn-row">
          <Link className="btn btn-primary" to="/oauth/clients">
            Manage OAuth clients
          </Link>
        </div>
      </Card>
    </main>
  );
}

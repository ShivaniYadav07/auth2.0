import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          OAuth 2.0 Demo
        </Link>
        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/oauth/clients">OAuth Clients</Link>
              <span className="navbar-user">{user.email}</span>
              <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}

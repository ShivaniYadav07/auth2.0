import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navLink = 'text-sm text-gray-600 no-underline hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex flex-1 flex-col">
      <nav className="flex items-center justify-between border-b border-gray-200 px-6 py-3.5 dark:border-gray-800">
        <Link to="/" className="text-lg font-bold text-gray-900 no-underline dark:text-gray-100">
          OAuth 2.0 Demo
        </Link>
        <div className="flex items-center gap-[18px]">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={navLink}>
                Dashboard
              </Link>
              <Link to="/oauth/clients" className={navLink}>
                OAuth Clients
              </Link>
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                type="button"
                className="cursor-pointer rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:border-violet-500 hover:text-violet-600 dark:border-gray-700 dark:text-gray-100 dark:hover:text-violet-400"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={navLink}>
                Login
              </Link>
              <Link to="/register" className={navLink}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}

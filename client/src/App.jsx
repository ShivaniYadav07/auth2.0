import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OAuthClients from './pages/OAuthClients';
import Authorize from './pages/Authorize';
import OAuthCallback from './pages/OAuthCallback';
import Success from './pages/Success';
import ErrorPage from './pages/ErrorPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/oauth/clients"
              element={
                <ProtectedRoute>
                  <OAuthClients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/oauth/authorize"
              element={
                <ProtectedRoute>
                  <Authorize />
                </ProtectedRoute>
              }
            />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/success" element={<Success />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

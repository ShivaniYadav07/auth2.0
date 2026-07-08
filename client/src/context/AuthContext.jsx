import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loginUser, logoutUser, registerUser, refreshSession } from '../api/authApi';
import { getCurrentUser } from '../api/userApi';
import { setAccessToken, setUnauthorizedHandler } from '../utils/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True until the initial silent-refresh attempt (via the refresh_token cookie) resolves.
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  // On first load the browser only has the HttpOnly refresh_token cookie (if any) - there
  // is no access token in memory yet. Try to silently mint one so a page refresh doesn't
  // log the user out.
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    // Refresh tokens are single-use (rotation). React 18 StrictMode double-invokes
    // effects in dev - mount, cleanup, mount again, synchronously - which would
    // otherwise fire /auth/refresh twice: the second call would present an
    // already-rotated token and trip theft detection, revoking the session it just
    // created. The ref guard makes the body run only once for real. (A `cancelled`
    // flag set by the synthetic cleanup would break this too, since AuthProvider
    // never truly unmounts during the app's lifetime - so this effect deliberately
    // has no cleanup.)
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    async function bootstrap() {
      try {
        const { accessToken } = await refreshSession();
        setAccessToken(accessToken);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [clearSession]);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  const login = useCallback(async (payload) => {
    const data = await loginUser(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), register, login, logout }),
    [user, loading, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

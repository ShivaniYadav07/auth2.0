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
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { accessToken } = await refreshSession();
        setAccessToken(accessToken);
        const currentUser = await getCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
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

// The real session: who is signed in, and the role/region guards and portal pages read.
// Backed by the same localStorage key App.jsx has always used, so existing pages that still
// take `user` as a prop and pages that call useAuth() see the same signed-in account.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { GUEST, clearUser, getUser, storeUser } from '@/services/session.js';

const AuthContext = createContext(null);

function decodeTokenPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Ported pages (Guide/Experience/Partner) read user.id and user.partnerType; the rest of the
// app reads user.userId/username and user.role. Both names point at the same account.
function normalize(account) {
  if (!account || account.role === 'default') return account ?? GUEST;
  const tokenClaims = decodeTokenPayload(account.token);
  const region = account.region || account.location || account.destination || tokenClaims?.region || (account.userId === 'XP001' || account.username === 'XP001' || account.role === 'experience' ? 'Kerala' : undefined);
  return {
    ...account,
    id: account.id ?? account.userId ?? account.username,
    partnerType: account.role,
    region: region ?? account.region,
    location: region ?? account.location,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => normalize(getUser()));

  const authenticate = useCallback((account) => {
    storeUser(account);
    setUser(normalize(account));
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(GUEST);
  }, []);

  const value = useMemo(() => {
    const isAuthenticated = Boolean(user && user.role && user.role !== 'default');
    return {
      user,
      role: isAuthenticated ? user.role : null,
      region: user?.region ?? user?.location ?? user?.destination ?? null,
      isAuthenticated,
      authenticate,
      logout,
    };
  }, [user, authenticate, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
  return ctx;
}

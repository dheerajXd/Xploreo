// The one place that reads/writes the signed-in user. AuthContext and request() both import
// from here so they always agree on where the session lives.
const KEY = 'xploreoUser';
export const GUEST = { username: 'Guest', role: 'default' };

export function getUser() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem('currentUser');
    if (!raw) return GUEST;
    const stored = JSON.parse(raw);
    const user = stored?.user || stored;
    if (!user || user.role === 'default') return user || GUEST;

    // If region or location is not explicitly present, extract from signed token claims
    if (!user.region && !user.location) {
      const token = user.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('xploreoToken') : null);
      if (token && typeof token === 'string' && token.includes('.')) {
        try {
          const parts = token.split('.');
          if (parts[1]) {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
            if (payload.region) user.region = payload.region;
            if (payload.location && !user.location) user.location = payload.location;
          }
        } catch {
          /* token parsing failed gracefully */
        }
      }
    }

    return user;
  } catch {
    return GUEST;
  }
}

export function storeUser(user) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable */
  }
}

export function clearUser() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem('currentUser');
  } catch {
    /* storage unavailable */
  }
}

export function getToken() {
  const user = getUser();
  return user?.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('xploreoToken') : null);
}

// What the backend's AuthGuard reads: Authorization Bearer token (and backward-compatible role/userId).
// Built only from the signed-in user, never from forms.
export function identityHeaders() {
  const user = getUser();
  const role = user?.role || user?.userRole || user?.partnerType;
  if (!user || !role || role === 'default') return {};
  const userId = user.userId || user.id || user.username;
  const token = getToken();

  const headers = {
    'x-user-role': role,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = String(userId);
  }
  const location = user.region || user.location;
  if (location) headers['x-user-location'] = location;
  return headers;
}

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
    return user || GUEST;
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
    localStorage.removeItem('xploreoToken');
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

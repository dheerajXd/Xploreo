// The one place that reads/writes the signed-in user. AuthContext and request() both import
// from here so they always agree on where the session lives.
const KEY = 'xploreoUser';
export const GUEST = { username: 'Guest', role: 'default' };

export function getUser() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    return stored || GUEST;
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
  } catch {
    /* storage unavailable */
  }
}

// What the backend's AuthGuard reads: x-user-id / x-user-role (and x-user-location once the
// backend tracks a partner's region). Built only from the signed-in user, never from forms.
export function identityHeaders() {
  const user = getUser();
  if (!user || user.role === 'default') return {};
  const headers = {
    'x-user-id': user.userId || user.id || user.username,
    'x-user-role': user.role,
  };
  if (user.region || user.location) headers['x-user-location'] = user.region || user.location;
  return headers;
}

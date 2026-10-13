const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message[0] : payload.message || "Something went wrong. Please try again.";
    throw new Error(message);
  }
  return payload.data ?? payload;
}

export const authApi = {
  login: (credentials) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (details) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(details) }),
};

export { API_BASE_URL };

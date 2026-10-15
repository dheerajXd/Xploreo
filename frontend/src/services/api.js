import { identityHeaders } from "./session.js";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:3000/api";

export async function apiRequest(path, options = {}) {
  const headers = {
    ...identityHeaders(),
    ...options.headers,
  };
  if (!(options.body instanceof FormData) && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
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

export async function fetchData(url, options = {}) {
  const headers = {
    ...identityHeaders(),
    ...options.headers,
  };
  if (!(options.body instanceof FormData) && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const json = await response.json();
  return json?.data !== undefined ? json.data : json;
}

export function getSavedUser() {
  try {
    const raw = localStorage.getItem("xploreoUser") || localStorage.getItem("currentUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user || parsed;
  } catch {
    return null;
  }
}

export { API_BASE_URL, identityHeaders };


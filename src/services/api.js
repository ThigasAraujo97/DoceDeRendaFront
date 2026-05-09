import axios from "axios";

// In development, VITE_API_BASE is intentionally empty so that axios uses
// relative URLs that are intercepted and proxied by the Vite dev server.
// This avoids cross-origin CORS preflights that would block [Authorize] endpoints.
// In production, VITE_API_BASE is set to the full backend URL in .env.production.
const API_BASE = import.meta.env.VITE_API_BASE || "";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Bearer token when present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Response interceptor: handle 401/403 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    // build a client-friendly message summarizing server response or network error
    try {
      const url = error?.config?.url;
      const serverData = error?.response?.data;
      const serverMsg = serverData?.message ?? (typeof serverData === "string" ? serverData : JSON.stringify(serverData));
      error.clientMessage = serverMsg || error.message || "Network Error";
      error.clientInfo = { status, url };
    } catch (e) {
      error.clientMessage = error.message || "Network Error";
    }

    if ((status === 401 || status === 403) && !error?.config?.skipAuthRedirect) {
      // clear token and redirect to the client-side login route
      // Use a hash URL so the browser requests '/' (index) instead of '/login',
      // avoiding backend servers that don't serve the SPA route and return 405.
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (typeof window !== "undefined") {
        try {
          window.location.href = "/#/login";
        } catch (e) {
          // fallback to replacing pathname
          window.location.replace("/#/login");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

/* Optional: attach auth token from cookie / localStorage later */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach active hub context for scoped admin requests
    const hubId = localStorage.getItem("activeHubId");
    if (hubId) {
      config.headers["X-Hub-Id"] = hubId;
    }
  }
  return config;
});

export default api;

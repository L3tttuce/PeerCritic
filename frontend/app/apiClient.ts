import axios from "axios";
import { notifyAuthChanged } from "@/app/authEvents";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const requestUrl = originalRequest.url ?? "";

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !requestUrl.includes("/refresh") &&
      !requestUrl.includes("/login")
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        localStorage.removeItem("accessToken");
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await api.post(
          "/refresh",
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        localStorage.setItem("accessToken", refreshResponse.data.access_token);
        localStorage.setItem("refreshToken", refreshResponse.data.refresh_token);
        notifyAuthChanged();

        originalRequest.headers.Authorization =
          `Bearer ${refreshResponse.data.access_token}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function getWsUrl(path: string): string {
  const base = new URL(API_BASE_URL);
  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${base.host}${path}`;
}

export { api };
export default api;

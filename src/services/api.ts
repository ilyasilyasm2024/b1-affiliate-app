const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status?: number;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("influencer_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || data.errors?.join(", ") || "Etwas ist schiefgelaufen", status: res.status };
    }
    return { data, status: res.status };
  } catch {
    return { error: "Netzwerkfehler. Bitte Verbindung prüfen.", status: 0 };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  postAdmin: <T>(endpoint: string, body: unknown, adminSecret: string) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "x-admin-secret": adminSecret },
    }),
  putAdmin: <T>(endpoint: string, body: unknown, adminSecret: string) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "x-admin-secret": adminSecret },
    }),
  getAdmin: <T>(endpoint: string, adminSecret: string) =>
    request<T>(endpoint, { headers: { "x-admin-secret": adminSecret } }),
};

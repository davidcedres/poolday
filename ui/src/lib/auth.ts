const BASE = "http://localhost:3001";
const TOKEN_KEY = "poolday_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function post(path: string, body: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export async function signup(email: string, password: string): Promise<string> {
  const data = await post("/api/auth/signup", { email, password });
  return data.token;
}

export async function login(email: string, password: string): Promise<string> {
  const data = await post("/api/auth/login", { email, password });
  return data.token;
}

export async function getJiraCredentials(): Promise<{ configured: boolean; host?: string; email?: string }> {
  const res = await fetch(`${BASE}/api/jira/credentials`, { headers: authHeaders() });
  if (res.status === 401) { clearToken(); throw new Error("Unauthorized"); }
  return res.json();
}

export async function saveJiraCredentials(host: string, email: string, token: string): Promise<void> {
  await post("/api/jira/credentials", { host, email, token });
}

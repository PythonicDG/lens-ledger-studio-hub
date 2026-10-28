const API_URL = (import.meta.env["VITE_API_URL"] || "http://127.0.0.1:8000").replace(/\/$/, "");
const TOKEN_KEY = "frameflow.auth_token";

type Account = { id: number; full_name: string; email: string; phone: string };

export class ApiError extends Error {
  constructor(message: string, public fields: Record<string, string> = {}, public status?: number) {
    super(message);
  }
}

async function request<T>(path: string, body: unknown, method = "POST", authenticated = false): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(authenticated && getAuthToken() ? { Authorization: `Token ${getAuthToken()}` } : {}) },
      ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.");
  }

  const data = await response.json();
  if (!response.ok) {
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) fields[key] = String(value[0]);
    }
    throw new ApiError(data.detail || Object.values(fields)[0] || "Something went wrong.", fields, response.status);
  }
  return data as T;
}

export function registerAccount(data: { full_name: string; email: string; phone: string; password: string }) {
  return request<{ detail: string }>("/api/auth/register/", data);
}

export function createStudio(data: { name: string; logo?: string; city?: string; state?: string; business_type?: string; gstin?: string }) {
  return request("/api/auth/studio/", data, "POST", true);
}

export function updateStudio(data: { name?: string; logo?: string; city?: string; state?: string; business_type?: string; gstin?: string }) {
  return request("/api/auth/studio/", data, "PATCH", true);
}

export function fetchStudio() {
  return request<{ name: string; logo: string; city: string; state: string; business_type: string; gstin: string; trial_started_at: string | null }>("/api/auth/studio/", null, "GET", true);
}

export function startTrial() {
  return request<{ trial_started_at: string }>("/api/auth/trial/start/", {}, "POST", true);
}

export async function loginAccount(email: string, password: string) {
  const result = await request<{ token: string; user: Account }>("/api/auth/login/", { email, password });
  if (typeof window !== "undefined") sessionStorage.setItem(TOKEN_KEY, result.token);
  return result.user;
}

export function getAuthToken() {
  return typeof window === "undefined" ? null : sessionStorage.getItem(TOKEN_KEY);
}

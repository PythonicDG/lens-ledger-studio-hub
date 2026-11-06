const API_URL = (import.meta.env["VITE_API_URL"] || "http://127.0.0.1:8000").replace(/\/$/, "");
const TOKEN_KEY = "frameflow.auth_token";

type Account = { id: number; full_name: string; email: string; phone: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
    public status?: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  body: unknown,
  method = "POST",
  authenticated = false,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authenticated && getAuthToken() ? { Authorization: `Token ${getAuthToken()}` } : {}),
      },
      ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.");
  }

  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) fields[key] = String(value[0]);
    }
    throw new ApiError(
      data.detail || Object.values(fields)[0] || "Something went wrong.",
      fields,
      response.status,
    );
  }
  return data as T;
}

export function registerAccount(data: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}) {
  return request<{ detail: string }>("/api/auth/register/", data);
}

export function createStudio(data: {
  name: string;
  logo?: string;
  city?: string;
  state?: string;
  business_type?: string;
  gstin?: string;
}) {
  return request("/api/auth/studio/", data, "POST", true);
}

export function updateStudio(data: {
  name?: string;
  logo?: string;
  city?: string;
  state?: string;
  business_type?: string;
  gstin?: string;
}) {
  return request("/api/auth/studio/", data, "PATCH", true);
}

export function fetchStudio() {
  return request<{
    name: string;
    logo: string;
    city: string;
    state: string;
    business_type: string;
    gstin: string;
    trial_started_at: string | null;
  }>("/api/auth/studio/", null, "GET", true);
}

export function startTrial() {
  return request<{ trial_started_at: string }>("/api/auth/trial/start/", {}, "POST", true);
}

export async function loginAccount(email: string, password: string) {
  const result = await request<{ token: string; user: Account }>("/api/auth/login/", {
    email,
    password,
  });
  if (typeof window !== "undefined") sessionStorage.setItem(TOKEN_KEY, result.token);
  return result.user;
}

export function getAuthToken() {
  return typeof window === "undefined" ? null : sessionStorage.getItem(TOKEN_KEY);
}

export async function logoutAccount() {
  try {
    await request("/api/auth/logout/", {}, "POST", true);
  } catch {
    // End the browser session even if the server is unavailable.
  } finally {
    if (typeof window !== "undefined") sessionStorage.removeItem(TOKEN_KEY);
  }
}

export type SharedQuoteStatus = {
  id: string;
  local_id: string;
  status: "Pending" | "Accepted" | "Rejected" | "Changes requested" | "Superseded";
  version: number;
  root_local_id: string;
  feedback: string;
};
export type PublicQuote = {
  id: string;
  studio_name: string;
  studio_city: string;
  status: SharedQuoteStatus["status"];
  version: number;
  snapshot: {
    number: string;
    event: string;
    client_name: string;
    date: string;
    location: string;
    items: { name: string; price: number }[];
    package_details?: {
      name: string;
      category: string;
      team: string[];
      deliverables: string[];
      notes: string;
    };
    packages?: {
      id: string;
      title: string;
      price: number;
      count_in_total: boolean;
      team: { qty: number; role: string }[];
      materials: string[];
      gift: string;
    }[];
    subtotal: number;
    discount: number;
    total: number;
    advance: number;
    balance?: number;
    terms: string;
  };
};

export function listSharedQuotes() {
  return request<SharedQuoteStatus[]>("/api/auth/quotes/", null, "GET", true);
}

export function publishQuote(local_id: string, root_local_id: string, snapshot: PublicQuote["snapshot"]) {
  return request<{ id: string; status: SharedQuoteStatus["status"]; version: number }>(
    "/api/auth/quotes/",
    { local_id, root_local_id, snapshot },
    "POST",
    true,
  );
}

export async function fetchPublicQuote(id: string): Promise<PublicQuote> {
  const response = await fetch(`${API_URL}/api/auth/quotes/${encodeURIComponent(id)}/`);
  if (!response.ok) throw new ApiError("Quotation unavailable.", {}, response.status);
  return response.json();
}

export async function decidePublicQuote(id: string, status: "Accepted" | "Rejected" | "Changes requested", feedback = "") {
  const response = await fetch(`${API_URL}/api/auth/quotes/${encodeURIComponent(id)}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, feedback }),
  });
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(result.detail || "Could not record your decision.", {}, response.status);
  return result as { status: SharedQuoteStatus["status"] };
}

/** Whole-studio data as stored on the server; `initialized` is false until the first save. */
export function fetchPlatformData<T>() {
  return request<{ initialized: boolean; data: T }>("/api/auth/platform/", null, "GET", true);
}

export function savePlatformData<T>(data: T) {
  return request<{ initialized: boolean; data: T }>("/api/auth/platform/", data, "PUT", true);
}

export async function emailDocument(recipient: string, kind: "invoice" | "receipt", pdf: Blob) {
  const form = new FormData();
  form.append("recipient", recipient);
  form.append("kind", kind);
  form.append("document", pdf, `${kind}.pdf`);
  const response = await fetch(`${API_URL}/api/auth/documents/email/`, {
    method: "POST",
    headers: { Authorization: `Token ${getAuthToken() || ""}` },
    body: form,
  });
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(result.detail || "Could not send document.", {}, response.status);
  return result as { detail: string };
}

export async function whatsappQuotation(
  phone: string,
  details: { clientName: string; event: string; number: string; total: string },
  pdf: Blob,
) {
  const form = new FormData();
  form.append("phone", phone);
  form.append("client_name", details.clientName);
  form.append("event", details.event);
  form.append("number", details.number);
  form.append("total", details.total);
  form.append("document", pdf, `quotation-${details.number}.pdf`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/documents/whatsapp/`, {
      method: "POST",
      headers: { Authorization: `Token ${getAuthToken() || ""}` },
      body: form,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.");
  }
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(result.detail || "Could not send on WhatsApp.", {}, response.status);
  return result as { detail: string; message_id: string };
}

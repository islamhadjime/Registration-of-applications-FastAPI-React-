import type {
  AuthResponse,
  CreateRequestPayload,
  ListParams,
  PaginatedRequests,
  Request,
  RequestStatus,
  User,
} from "./types";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      return data.detail.map((e: { msg?: string }) => e.msg ?? "Ошибка").join("; ");
    }
  } catch {
    // ignore
  }
  return `Ошибка ${response.status}`;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function fetchMe(): Promise<User> {
  return request<User>("/api/auth/me", {}, true);
}

export async function fetchRequests(params: ListParams): Promise<PaginatedRequests> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  if (params.search) query.set("search", params.search);
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));

  const qs = query.toString();
  return request<PaginatedRequests>(`/api/requests${qs ? `?${qs}` : ""}`);
}

export async function createRequest(payload: CreateRequestPayload): Promise<Request> {
  return request<Request>("/api/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRequestStatus(
  id: number,
  status: RequestStatus
): Promise<Request> {
  return request<Request>(`/api/requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteRequest(id: number): Promise<void> {
  await request<void>(`/api/requests/${id}`, { method: "DELETE" }, true);
}

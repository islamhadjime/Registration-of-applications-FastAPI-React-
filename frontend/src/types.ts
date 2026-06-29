export type RequestStatus = "new" | "in_progress" | "done";
export type RequestPriority = "low" | "normal" | "high";
export type SortField = "created_at" | "priority";
export type SortOrder = "asc" | "desc";
export type UserRole = "user" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Request {
  id: number;
  title: string;
  description: string | null;
  status: RequestStatus;
  priority: RequestPriority;
  created_at: string;
  updated_at: string;
}

export interface PaginatedRequests {
  items: Request[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListParams {
  status?: RequestStatus;
  priority?: RequestPriority;
  search?: string;
  sort_by?: SortField;
  sort_order?: SortOrder;
  page?: number;
  page_size?: number;
}

export interface CreateRequestPayload {
  title: string;
  description?: string;
  priority: RequestPriority;
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Выполнена",
};

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
};

export const STATUS_OPTIONS: RequestStatus[] = ["new", "in_progress", "done"];
export const PRIORITY_OPTIONS: RequestPriority[] = ["low", "normal", "high"];

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Пользователь",
  admin: "Администратор",
};

import apiClient from "./client";

export type ServerEventLevel = "info" | "warning" | "error";
export type ServerEventCategory = "system" | "audit";

export interface ServerEvent {
  id: string;
  category: ServerEventCategory;
  event_type: string;
  level: ServerEventLevel;
  source: string | null;
  message: string;
  metadata: unknown;
  actor_user_id: string | null;
  ip_address: string | null;
  subject_type: string | null;
  subject_id: string | null;
  before_data: unknown;
  after_data: unknown;
  correlation_id: string | null;
  created_at: string;
}

export interface ServerEventListResponse {
  events: ServerEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServerEventFilters {
  page?: number;
  limit?: number;
  level?: ServerEventLevel | "";
  category?: ServerEventCategory | "";
  eventType?: string;
  from?: string;
  to?: string;
}

export const fetchServerEvents = async (filters: ServerEventFilters) => {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.level) params.set("level", filters.level);
  if (filters.category) params.set("category", filters.category);
  if (filters.eventType?.trim()) params.set("eventType", filters.eventType.trim());
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);

  const res = await apiClient.get(`/admin/server-events?${params.toString()}`);
  return res.data as ServerEventListResponse;
};

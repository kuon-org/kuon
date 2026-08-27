import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export type ServerEventLevel = "info" | "warning" | "error";

export interface ServerEvent {
  id: string;
  category: "system" | "audit";
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
  eventType?: string;
  from?: string;
  to?: string;
}

export const useServerEvents = (filters: ServerEventFilters) => {
  return useQuery<ServerEventListResponse>({
    queryKey: ["server-events", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.level) params.set("level", filters.level);
      if (filters.eventType?.trim()) params.set("eventType", filters.eventType.trim());
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      const res = await apiClient.get(`/admin/server-events?${params.toString()}`);
      return res.data as ServerEventListResponse;
    },
  });
};

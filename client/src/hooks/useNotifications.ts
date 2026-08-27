import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

export interface AppNotification {
  id: string;
  type: string | null;
  title: string | null;
  message: string | null;
  reference_id: string | null;
  is_read: boolean | null;
  created_at: string | null;
  href: string | null;
}

export const useNotifications = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await apiClient.get<AppNotification[]>("/notifications?limit=10");
      return data;
    },
    enabled,
  });

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ count: number }>(
        "/notifications/unread-count",
      );
      return data.count;
    },
    enabled,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.patch(`/notifications/${notificationId}/read`),
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.patch("/notifications/read-all"),
    onSuccess: invalidate,
  });

  useEffect(() => {
    if (!enabled) return;

    const source = new EventSource("/api/notifications/stream");
    source.addEventListener("notifications-changed", invalidate);

    return () => source.close();
  }, [enabled, queryClient]);

  return {
    notifications: notificationsQuery.data ?? [],
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
  };
};

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

export type NotificationReason = "followed_tag" | "followed_user";

export interface NotificationAction {
  type: "follow_back";
  targetUserId: string;
  isFollowing: boolean;
}

export interface AppNotification {
  id: string;
  type: string | null;
  title: string | null;
  message: string | null;
  reference_id: string | null;
  reference_type: string | null;
  reasons: NotificationReason[];
  is_read: boolean | null;
  created_at: string | null;
  href: string | null;
  action: NotificationAction | null;
}

export interface NotificationPreferences {
  notifyOnArticleComment: boolean;
  notifyOnCommentReply: boolean;
  notifyOnFollowedTagArticle: boolean;
  notifyOnFollowedUserArticle: boolean;
  notifyOnUserFollow: boolean;
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

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.delete(`/notifications/${notificationId}`),
    onSuccess: invalidate,
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => apiClient.delete("/notifications"),
    onSuccess: invalidate,
  });

  const followBackMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data } = await apiClient.post<{ isFollow: boolean }>("/users/follow", {
        followeeId: targetUserId,
      });
      return data;
    },
    onSuccess: async (_data, targetUserId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["isFollowing", targetUserId] }),
        queryClient.invalidateQueries({ queryKey: ["following"] }),
        queryClient.invalidateQueries({ queryKey: ["follower"] }),
      ]);
    },
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
    deleteNotification: deleteNotificationMutation.mutateAsync,
    deleteAll: deleteAllMutation.mutateAsync,
    followBack: followBackMutation.mutateAsync,
    isFollowBackPending: followBackMutation.isPending,
  };
};

export const useNotificationPreferences = () => {
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationPreferences>(
        "/notifications/preferences",
      );
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      const { data } = await apiClient.put<NotificationPreferences>(
        "/notifications/preferences",
        preferences,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["notifications", "preferences"], data);
    },
  });

  return {
    preferences: preferencesQuery.data,
    isLoading: preferencesQuery.isLoading,
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};

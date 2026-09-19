import apiClient from "./client";

export type NotificationReason =
  "followed_tag" | "followed_user" | "followed_group";

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
  notifyOnFollowedGroupArticle: boolean;
  notifyOnUserFollow: boolean;
}

export const fetchNotifications = async () => {
  const { data } = await apiClient.get<AppNotification[]>(
    "/notifications?limit=10",
  );
  return data;
};

export const fetchUnreadCount = async () => {
  const { data } = await apiClient.get<{ count: number }>(
    "/notifications/unread-count",
  );
  return data.count;
};

export const markNotificationRead = (notificationId: string) =>
  apiClient.patch(`/notifications/${notificationId}/read`);

export const markAllNotificationsRead = () =>
  apiClient.patch("/notifications/read-all");

export const deleteNotification = (notificationId: string) =>
  apiClient.delete(`/notifications/${notificationId}`);

export const deleteAllNotifications = () => apiClient.delete("/notifications");

export const followBack = async (targetUserId: string) => {
  const { data } = await apiClient.post<{ isFollow: boolean }>(
    "/users/follow",
    {
      followeeId: targetUserId,
    },
  );
  return data;
};

export const fetchNotificationPreferences = async () => {
  const { data } = await apiClient.get<NotificationPreferences>(
    "/notifications/preferences",
  );
  return data;
};

export const updateNotificationPreferences = async (
  preferences: NotificationPreferences,
) => {
  const { data } = await apiClient.put<NotificationPreferences>(
    "/notifications/preferences",
    preferences,
  );
  return data;
};

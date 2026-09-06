import { useQuery } from "@tanstack/react-query";
import {
  fetchNotificationPreferences,
  fetchNotifications,
  fetchUnreadCount,
} from "../../api/notifications";
import { notificationKeys } from "./keys";

export const useNotificationsQuery = (enabled: boolean) =>
  useQuery({
    queryKey: notificationKeys.list(),
    queryFn: fetchNotifications,
    enabled,
  });

export const useUnreadNotificationCountQuery = (enabled: boolean) =>
  useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: fetchUnreadCount,
    enabled,
  });

export const useNotificationPreferencesQuery = () =>
  useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: fetchNotificationPreferences,
  });

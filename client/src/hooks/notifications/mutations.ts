import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteAllNotifications,
  deleteNotification,
  followBack,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from "../../api/notifications";
import { notificationKeys } from "./keys";

const useInvalidateNotifications = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
};

export const useMarkNotificationRead = () => {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });
};

export const useMarkAllNotificationsRead = () => {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });
};

export const useDeleteNotification = () => {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: deleteNotification, onSuccess: invalidate });
};

export const useDeleteAllNotifications = () => {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: invalidate,
  });
};

export const useFollowBack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: followBack,
    onSuccess: async (_data, targetUserId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
        queryClient.invalidateQueries({
          queryKey: ["isFollowing", targetUserId],
        }),
        queryClient.invalidateQueries({ queryKey: ["following"] }),
        queryClient.invalidateQueries({ queryKey: ["follower"] }),
      ]);
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (data) =>
      queryClient.setQueryData(notificationKeys.preferences(), data),
  });
};

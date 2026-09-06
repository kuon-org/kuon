import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "./keys";

export const useNotificationStream = (enabled: boolean) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const source = new EventSource("/api/notifications/stream");
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };
    source.addEventListener("notifications-changed", invalidate);

    return () => source.close();
  }, [enabled, queryClient]);
};

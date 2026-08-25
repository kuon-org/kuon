import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export type PublishWebhookOption = {
  id: string;
  name: string;
  provider: "generic" | "discord" | "slack" | "teams";
  scope: "system" | "user";
};

export const usePublishWebhooks = () =>
  useQuery<PublishWebhookOption[]>({
    queryKey: ["publishWebhookOptions"],
    queryFn: async () => {
      const { data } = await apiClient.get(
        "/webhooks/available/article-published",
      );
      return data;
    },
    staleTime: 30_000,
  });

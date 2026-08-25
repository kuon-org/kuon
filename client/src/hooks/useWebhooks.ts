import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

export type WebhookVariable = { key: string; label: string; group: string };
export type WebhookEventMetadata = {
  type: string;
  label: string;
  scopes: ("system" | "user")[];
  variables: WebhookVariable[];
};
export type WebhookPreset = {
  id: string;
  provider: "generic" | "discord" | "slack" | "teams";
  label: string;
  payloadTemplate: unknown;
};
export type WebhookMetadata = {
  events: WebhookEventMetadata[];
  presets: WebhookPreset[];
};
export type WebhookHeader = { name: string; value: string; isSecret?: boolean };
export type WebhookInput = {
  name: string;
  scope: "system" | "user";
  ownerUserId?: string | null;
  provider: "generic" | "discord" | "slack" | "teams";
  url: string;
  httpMethod?: "POST";
  payloadTemplate: unknown;
  events: string[];
  headers?: WebhookHeader[];
  isActive?: boolean;
};

export const useWebhookAdmin = () => {
  const queryClient = useQueryClient();
  const metadata = useQuery<WebhookMetadata>({
    queryKey: ["webhookMetadata"],
    queryFn: async () => (await apiClient.get("/admin/webhooks/metadata")).data,
  });
  const webhooks = useQuery<any[]>({
    queryKey: ["adminWebhooks"],
    queryFn: async () => (await apiClient.get("/admin/webhooks")).data,
  });
  const save = useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: WebhookInput }) =>
      id
        ? (await apiClient.put(`/admin/webhooks/${id}`, input)).data
        : (await apiClient.post("/admin/webhooks", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminWebhooks"] }),
  });
  const preview = useMutation({
    mutationFn: async (payloadTemplate: unknown) =>
      (await apiClient.post("/admin/webhooks/preview", { payloadTemplate })).data,
  });
  const testSend = useMutation({
    mutationFn: async (input: Pick<WebhookInput, "url" | "headers" | "payloadTemplate">) =>
      (await apiClient.post("/admin/webhooks/test", input)).data,
  });

  return {
    metadata: metadata.data,
    metadataLoading: metadata.isLoading,
    webhooks: webhooks.data ?? [],
    saveWebhook: save.mutateAsync,
    savePending: save.isPending,
    previewPayload: preview.mutateAsync,
    previewPending: preview.isPending,
    testSend: testSend.mutateAsync,
    testPending: testSend.isPending,
  };
};

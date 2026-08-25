import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

export type WebhookVariable = { key: string; label: string; group: string };
export type WebhookEventMetadata = {
  type: string;
  displayName: string;
  scopes: ("system" | "user")[];
  variables: WebhookVariable[];
};
export type WebhookPreset = {
  id: string;
  provider: "generic" | "discord" | "slack" | "teams";
  name: string;
  description: string;
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
export type WebhookSummary = {
  id: string;
  name: string;
  scope: "system" | "user";
  ownerUserId: string | null;
  provider: WebhookInput["provider"];
  url: string;
  httpMethod: string;
  payloadTemplate: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type WebhookDetail = WebhookSummary & {
  events: string[];
  headers: WebhookHeader[];
};
export type WebhookDelivery = {
  id: string;
  webhookId: string;
  eventType: string;
  success: boolean;
  statusCode: number | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: string;
};

export const useWebhookAdmin = () => {
  const queryClient = useQueryClient();
  const metadata = useQuery<WebhookMetadata>({
    queryKey: ["webhookMetadata"],
    queryFn: async () => (await apiClient.get("/admin/webhooks/metadata")).data,
  });
  const webhooks = useQuery<WebhookSummary[]>({
    queryKey: ["adminWebhooks"],
    queryFn: async () => (await apiClient.get("/admin/webhooks")).data,
  });
  const save = useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: WebhookInput }) => {
      if (!id) {
        return (await apiClient.post("/admin/webhooks", input)).data;
      }

      const current = (await apiClient.get(`/admin/webhooks/${id}`)).data as WebhookDetail;
      return (
        await apiClient.put(`/admin/webhooks/${id}`, {
          ...input,
          isActive: current.isActive,
        })
      ).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["adminWebhooks"] });
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/webhooks/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["adminWebhooks"] });
    },
  });
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await apiClient.patch(`/admin/webhooks/${id}/active`, { isActive })).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["adminWebhooks"] });
    },
  });
  const preview = useMutation({
    mutationFn: async (payloadTemplate: unknown) =>
      (await apiClient.post("/admin/webhooks/preview", { payloadTemplate })).data,
  });
  const testSend = useMutation({
    mutationFn: async (input: Pick<WebhookInput, "url" | "headers" | "payloadTemplate">) =>
      (await apiClient.post("/admin/webhooks/test", input)).data,
  });

  const getWebhook = async (id: string) =>
    (await apiClient.get(`/admin/webhooks/${id}`)).data as WebhookDetail;
  const getDeliveries = async (id: string) =>
    (await apiClient.get(`/admin/webhooks/${id}/deliveries`)).data as WebhookDelivery[];

  return {
    metadata: metadata.data,
    metadataLoading: metadata.isLoading,
    webhooks: webhooks.data ?? [],
    webhooksLoading: webhooks.isLoading,
    getWebhook,
    getDeliveries,
    saveWebhook: save.mutateAsync,
    savePending: save.isPending,
    deleteWebhook: remove.mutateAsync,
    deletePending: remove.isPending,
    setWebhookActive: toggleActive.mutateAsync,
    togglePending: toggleActive.isPending,
    previewPayload: preview.mutateAsync,
    previewPending: preview.isPending,
    testSend: testSend.mutateAsync,
    testPending: testSend.isPending,
  };
};

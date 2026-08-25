import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

export type WebhookVariable = { key: string; label: string; group: string };
export type WebhookEventMetadata = {
  type: string;
  displayName: string;
  category?: "global" | "owner" | "recipient";
  scopes: ("system" | "user")[];
  userTarget?: string;
  variables: WebhookVariable[];
};
export type WebhookPreset = {
  id: string;
  event: string;
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
  event: string;
  headers?: WebhookHeader[];
  isActive?: boolean;
};
export type UserWebhookInput = Omit<WebhookInput, "scope" | "ownerUserId">;
export type WebhookSummary = {
  id: string;
  name: string;
  scope: "system" | "user";
  ownerUserId: string | null;
  provider: WebhookInput["provider"];
  url: string;
  httpMethod: string;
  payloadTemplate: unknown;
  event: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type WebhookDetail = WebhookSummary & {
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

type WebhookApiOptions = {
  basePath: string;
  queryKey: string;
  userScoped?: boolean;
};

type PreviewInput = {
  payloadTemplate: unknown;
  eventType?: string;
};

const isPreviewInput = (value: unknown): value is PreviewInput =>
  typeof value === "object" &&
  value !== null &&
  "payloadTemplate" in value;

const useWebhookApi = ({ basePath, queryKey, userScoped = false }: WebhookApiOptions) => {
  const queryClient = useQueryClient();
  const metadata = useQuery<WebhookMetadata>({
    queryKey: [queryKey, "metadata"],
    queryFn: async () => (await apiClient.get(`${basePath}/metadata`)).data,
  });
  const webhooks = useQuery<WebhookSummary[]>({
    queryKey: [queryKey],
    queryFn: async () => (await apiClient.get(basePath)).data,
  });
  const save = useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: WebhookInput | UserWebhookInput }) => {
      if (!id) return (await apiClient.post(basePath, input)).data;
      const current = (await apiClient.get(`${basePath}/${id}`)).data as WebhookDetail;
      return (await apiClient.put(`${basePath}/${id}`, { ...input, isActive: current.isActive })).data;
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`${basePath}/${id}`),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await apiClient.patch(`${basePath}/${id}/active`, { isActive })).data,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });
  const preview = useMutation({
    mutationFn: async (input: PreviewInput | unknown) => {
      const body = isPreviewInput(input)
        ? input
        : { payloadTemplate: input };
      return (await apiClient.post(`${basePath}/preview`, body)).data;
    },
  });
  const testSend = useMutation({
    mutationFn: async (input: Pick<WebhookInput, "url" | "headers" | "payloadTemplate"> & { eventType?: string }) =>
      (await apiClient.post(`${basePath}/test`, input)).data,
  });

  const getWebhook = async (id: string) =>
    (await apiClient.get(`${basePath}/${id}`)).data as WebhookDetail;
  const getDeliveries = async (id: string) =>
    (await apiClient.get(`${basePath}/${id}/deliveries`)).data as WebhookDelivery[];

  const scope = userScoped ? "user" : "system";
  const scopedMetadata = metadata.data
    ? {
        ...metadata.data,
        events: metadata.data.events.filter((event) => event.scopes.includes(scope)),
      }
    : undefined;

  return {
    userScoped,
    metadata: scopedMetadata,
    metadataLoading: metadata.isLoading,
    metadataError: metadata.error,
    webhooks: webhooks.data ?? [],
    webhooksLoading: webhooks.isLoading,
    webhooksError: webhooks.error,
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

export const useWebhookAdmin = () =>
  useWebhookApi({ basePath: "/admin/webhooks", queryKey: "adminWebhooks" });

export const useWebhookUser = () =>
  useWebhookApi({
    basePath: "/users/settings/webhooks",
    queryKey: "userWebhooks",
    userScoped: true,
  });

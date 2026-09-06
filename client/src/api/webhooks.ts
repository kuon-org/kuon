import apiClient from "./client";

export type WebhookScope = "admin" | "user";
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
export type WebhookDetail = WebhookSummary & { headers: WebhookHeader[] };
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
export type PublishWebhookOption = {
  id: string;
  name: string;
  provider: "generic" | "discord" | "slack" | "teams";
  scope: "system" | "user";
};
export type PreviewInput = { payloadTemplate: unknown; eventType?: string };
export type WebhookTestInput = Pick<WebhookInput, "url" | "headers" | "payloadTemplate"> & { eventType?: string };

const basePath = (scope: WebhookScope) =>
  scope === "admin" ? "/admin/webhooks" : "/users/settings/webhooks";

export const fetchWebhookMetadata = async (scope: WebhookScope) => {
  const { data } = await apiClient.get<WebhookMetadata>(`${basePath(scope)}/metadata`);
  const targetScope = scope === "admin" ? "system" : "user";
  return {
    ...data,
    events: data.events.filter((event) => event.scopes.includes(targetScope)),
  };
};

export const fetchWebhooks = async (scope: WebhookScope) =>
  (await apiClient.get<WebhookSummary[]>(basePath(scope))).data;

export const fetchWebhook = async (scope: WebhookScope, id: string) =>
  (await apiClient.get<WebhookDetail>(`${basePath(scope)}/${id}`)).data;

export const fetchWebhookDeliveries = async (scope: WebhookScope, id: string) =>
  (await apiClient.get<WebhookDelivery[]>(`${basePath(scope)}/${id}/deliveries`)).data;

export const fetchPublishWebhookOptions = async () =>
  (await apiClient.get<PublishWebhookOption[]>("/webhooks/available/article-published")).data;

export const saveWebhook = async (
  scope: WebhookScope,
  input: { id?: string; input: WebhookInput | UserWebhookInput },
) => {
  if (!input.id) return (await apiClient.post(basePath(scope), input.input)).data;
  const current = await fetchWebhook(scope, input.id);
  return (
    await apiClient.put(`${basePath(scope)}/${input.id}`, {
      ...input.input,
      isActive: current.isActive,
    })
  ).data;
};

export const deleteWebhook = async (scope: WebhookScope, id: string) =>
  apiClient.delete(`${basePath(scope)}/${id}`);

export const setWebhookActive = async (
  scope: WebhookScope,
  input: { id: string; isActive: boolean },
) => (await apiClient.patch(`${basePath(scope)}/${input.id}/active`, { isActive: input.isActive })).data;

export const previewWebhookPayload = async (scope: WebhookScope, input: PreviewInput | unknown) => {
  const body =
    typeof input === "object" && input !== null && "payloadTemplate" in input
      ? input
      : { payloadTemplate: input };
  return (await apiClient.post(`${basePath(scope)}/preview`, body)).data;
};

export const testWebhook = async (scope: WebhookScope, input: WebhookTestInput) =>
  (await apiClient.post(`${basePath(scope)}/test`, input)).data;

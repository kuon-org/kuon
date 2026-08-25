import type { WebhookEventType, WebhookScope } from "./events.js";

export type WebhookProvider = "generic" | "discord" | "slack" | "teams";

export type WebhookHeaderInput = {
  name: string;
  value: string;
  isSecret?: boolean;
};

export type CreateWebhookInput = {
  name: string;
  scope: WebhookScope;
  ownerUserId?: string | null;
  provider: WebhookProvider;
  url: string;
  httpMethod?: "POST";
  payloadTemplate: unknown;
  event: WebhookEventType;
  headers?: WebhookHeaderInput[];
};

export type UpdateWebhookInput = CreateWebhookInput & {
  isActive: boolean;
};

export type WebhookRecord = {
  id: string;
  name: string;
  scope: WebhookScope;
  ownerUserId: string | null;
  provider: WebhookProvider;
  url: string;
  httpMethod: string;
  payloadTemplate: unknown;
  event: WebhookEventType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type WebhookDetail = WebhookRecord & {
  headers: WebhookHeaderInput[];
};

export type WebhookDeliveryRecord = {
  id: string;
  webhookId: string;
  eventType: string;
  success: boolean;
  statusCode: number | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: Date;
};

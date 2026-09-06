import type { WebhookScope } from "../../api/webhooks";

export const webhookKeys = {
  all: ["webhooks"] as const,
  scope: (scope: WebhookScope) => [...webhookKeys.all, scope] as const,
  metadata: (scope: WebhookScope) => [...webhookKeys.scope(scope), "metadata"] as const,
  list: (scope: WebhookScope) => [...webhookKeys.scope(scope), "list"] as const,
  detail: (scope: WebhookScope, id?: string) => [...webhookKeys.scope(scope), "detail", id] as const,
  deliveries: (scope: WebhookScope, id?: string) => [...webhookKeys.scope(scope), "deliveries", id] as const,
};

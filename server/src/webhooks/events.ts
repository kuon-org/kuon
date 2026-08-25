export const WebhookEventType = {
  ArticlePublished: "article.published",
} as const;

export type WebhookEventType =
  (typeof WebhookEventType)[keyof typeof WebhookEventType];

export const WebhookScope = {
  System: "system",
  User: "user",
} as const;

export type WebhookScope =
  (typeof WebhookScope)[keyof typeof WebhookScope];

export type WebhookEventDefinition = {
  type: WebhookEventType;
  displayName: string;
  scopes: readonly WebhookScope[];
};

export const webhookEventDefinitions: readonly WebhookEventDefinition[] = [
  {
    type: WebhookEventType.ArticlePublished,
    displayName: "Article published",
    scopes: [WebhookScope.System, WebhookScope.User],
  },
] as const;

export const findWebhookEventDefinition = (type: string) =>
  webhookEventDefinitions.find((event) => event.type === type) ?? null;

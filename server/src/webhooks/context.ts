import { WebhookEventType } from "./events.js";

export type WebhookEventContextMap = {
  [WebhookEventType.ArticlePublished]: {
    event: {
      type: typeof WebhookEventType.ArticlePublished;
      createdAt: string;
    };
    article: {
      id: string;
      title: string;
      summary: string | null;
      url: string;
    };
    author: {
      username: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    };
  };
};

export type WebhookContext<T extends keyof WebhookEventContextMap> =
  WebhookEventContextMap[T];

export type AnyWebhookContext =
  WebhookEventContextMap[keyof WebhookEventContextMap];

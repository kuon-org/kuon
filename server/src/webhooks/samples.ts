import { WebhookEventType } from "./events.js";
import type { WebhookContext } from "./context.js";

export const articlePublishedSampleContext: WebhookContext<
  typeof WebhookEventType.ArticlePublished
> = {
  event: {
    type: WebhookEventType.ArticlePublished,
    createdAt: "2026-08-25T00:00:00.000Z",
  },
  article: {
    id: "0198d6ca-0000-7000-8000-000000000001",
    title: "Kuon Webhook Preview",
    summary: "Webhook payload preview用のサンプル記事です。",
    url: "https://kuon.example.com/user/kuon/sample-article",
  },
  author: {
    username: "kuon",
    displayName: "Kuon User",
    avatarUrl: "https://kuon.example.com/uploads/avatar.png",
  },
};

import { WebhookEventType, type WebhookEventType as WebhookEventTypeValue } from "./events.js";
import type { WebhookContext, WebhookEventContextMap } from "./context.js";

const sampleArticle = {
  id: "0198d6ca-0000-7000-8000-000000000001",
  title: "Kuon Webhook Preview",
  summary: "Webhook payload preview用のサンプル記事です。",
  url: "https://kuon.example.com/user/kuon/sample-article",
};

const sampleActor = {
  username: "kuon",
  displayName: "Kuon User",
  avatarUrl: "https://kuon.example.com/uploads/avatar.png",
};

export const articlePublishedSampleContext: WebhookContext<
  typeof WebhookEventType.ArticlePublished
> = {
  event: {
    type: WebhookEventType.ArticlePublished,
    createdAt: "2026-08-25T00:00:00.000Z",
  },
  article: sampleArticle,
  author: sampleActor,
};

export const webhookSampleContexts: WebhookEventContextMap = {
  [WebhookEventType.ArticlePublished]: articlePublishedSampleContext,
  [WebhookEventType.ArticleUpdated]: {
    event: {
      type: WebhookEventType.ArticleUpdated,
      createdAt: "2026-08-25T00:00:00.000Z",
    },
    article: sampleArticle,
    actor: sampleActor,
  },
  [WebhookEventType.CommentCreated]: {
    event: {
      type: WebhookEventType.CommentCreated,
      createdAt: "2026-08-25T00:00:00.000Z",
    },
    article: sampleArticle,
    comment: {
      id: "0198d6ca-0000-7000-8000-000000000002",
      body: "Webhook通知のサンプルコメントです。",
    },
    actor: sampleActor,
  },
  [WebhookEventType.ArticleLiked]: {
    event: {
      type: WebhookEventType.ArticleLiked,
      createdAt: "2026-08-25T00:00:00.000Z",
    },
    article: sampleArticle,
    actor: sampleActor,
  },
};

export const getWebhookSampleContext = <T extends WebhookEventTypeValue>(
  eventType: T,
): WebhookEventContextMap[T] => webhookSampleContexts[eventType];

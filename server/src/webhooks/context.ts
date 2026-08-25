import { WebhookEventType } from "./events.js";

type WebhookEventMeta<T extends string> = {
  type: T;
  createdAt: string;
};

type WebhookArticleContext = {
  id: string;
  title: string;
  summary: string | null;
  url: string;
};

type WebhookActorContext = {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type WebhookEventContextMap = {
  [WebhookEventType.ArticlePublished]: {
    event: WebhookEventMeta<typeof WebhookEventType.ArticlePublished>;
    article: WebhookArticleContext;
    author: WebhookActorContext;
  };
  [WebhookEventType.ArticleUpdated]: {
    event: WebhookEventMeta<typeof WebhookEventType.ArticleUpdated>;
    article: WebhookArticleContext;
    actor: WebhookActorContext;
  };
  [WebhookEventType.CommentCreated]: {
    event: WebhookEventMeta<typeof WebhookEventType.CommentCreated>;
    article: WebhookArticleContext;
    comment: {
      id: string;
      body: string;
    };
    actor: WebhookActorContext;
  };
  [WebhookEventType.ArticleLiked]: {
    event: WebhookEventMeta<typeof WebhookEventType.ArticleLiked>;
    article: WebhookArticleContext;
    actor: WebhookActorContext;
  };
  [WebhookEventType.MentionCreated]: {
    event: WebhookEventMeta<typeof WebhookEventType.MentionCreated>;
    article: WebhookArticleContext;
    actor: WebhookActorContext;
    mentioned: {
      username: string | null;
      displayName: string | null;
    };
  };
};

export type WebhookContext<T extends keyof WebhookEventContextMap> =
  WebhookEventContextMap[T];

export type AnyWebhookContext =
  WebhookEventContextMap[keyof WebhookEventContextMap];

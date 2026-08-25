export const WebhookEventType = {
  ArticlePublished: "article.published",
  ArticleUpdated: "article.updated",
  CommentCreated: "comment.created",
  ArticleLiked: "article.liked",
} as const;

export type WebhookEventType =
  (typeof WebhookEventType)[keyof typeof WebhookEventType];

export const WebhookScope = {
  System: "system",
  User: "user",
} as const;

export type WebhookScope =
  (typeof WebhookScope)[keyof typeof WebhookScope];

export const WebhookEventCategory = {
  Global: "global",
  Owner: "owner",
} as const;

export type WebhookEventCategory =
  (typeof WebhookEventCategory)[keyof typeof WebhookEventCategory];

export const WebhookUserTarget = {
  Actor: "actor",
  ArticleOwner: "article.owner",
} as const;

export type WebhookUserTarget =
  (typeof WebhookUserTarget)[keyof typeof WebhookUserTarget];

export type WebhookEventDefinition = {
  type: WebhookEventType;
  displayName: string;
  category: WebhookEventCategory;
  scopes: readonly WebhookScope[];
  userTarget: WebhookUserTarget;
};

export const webhookEventDefinitions: readonly WebhookEventDefinition[] = [
  {
    type: WebhookEventType.ArticlePublished,
    displayName: "Article published",
    category: WebhookEventCategory.Global,
    scopes: [WebhookScope.System, WebhookScope.User],
    userTarget: WebhookUserTarget.Actor,
  },
  {
    type: WebhookEventType.ArticleUpdated,
    displayName: "Article updated",
    category: WebhookEventCategory.Global,
    scopes: [WebhookScope.System, WebhookScope.User],
    userTarget: WebhookUserTarget.Actor,
  },
  {
    type: WebhookEventType.CommentCreated,
    displayName: "Comment created",
    category: WebhookEventCategory.Owner,
    scopes: [WebhookScope.User],
    userTarget: WebhookUserTarget.ArticleOwner,
  },
  {
    type: WebhookEventType.ArticleLiked,
    displayName: "Article liked",
    category: WebhookEventCategory.Owner,
    scopes: [WebhookScope.User],
    userTarget: WebhookUserTarget.ArticleOwner,
  },
] as const;

export const findWebhookEventDefinition = (type: string) =>
  webhookEventDefinitions.find((event) => event.type === type) ?? null;

import { WebhookEventType } from "./events.js";

export type WebhookVariableDefinition = {
  key: string;
  label: string;
  group: "Event" | "Article" | "Author" | "Actor" | "Comment";
};

const eventVariables = [
  { key: "event.type", label: "Event type", group: "Event" },
  { key: "event.createdAt", label: "Created at", group: "Event" },
] as const satisfies readonly WebhookVariableDefinition[];

const articleVariables = [
  { key: "article.id", label: "Article ID", group: "Article" },
  { key: "article.title", label: "Article title", group: "Article" },
  { key: "article.summary", label: "Article summary", group: "Article" },
  { key: "article.url", label: "Article URL", group: "Article" },
] as const satisfies readonly WebhookVariableDefinition[];

const actorVariables = [
  { key: "actor.username", label: "Actor username", group: "Actor" },
  { key: "actor.displayName", label: "Actor display name", group: "Actor" },
  { key: "actor.avatarUrl", label: "Actor avatar URL", group: "Actor" },
] as const satisfies readonly WebhookVariableDefinition[];

export const articlePublishedVariables: readonly WebhookVariableDefinition[] = [
  ...eventVariables,
  ...articleVariables,
  { key: "author.username", label: "Author username", group: "Author" },
  {
    key: "author.displayName",
    label: "Author display name",
    group: "Author",
  },
  { key: "author.avatarUrl", label: "Author avatar URL", group: "Author" },
];

export const articleUpdatedVariables: readonly WebhookVariableDefinition[] = [
  ...eventVariables,
  ...articleVariables,
  ...actorVariables,
];

export const commentCreatedVariables: readonly WebhookVariableDefinition[] = [
  ...eventVariables,
  ...articleVariables,
  { key: "comment.id", label: "Comment ID", group: "Comment" },
  { key: "comment.body", label: "Comment body", group: "Comment" },
  ...actorVariables,
];

export const articleLikedVariables: readonly WebhookVariableDefinition[] = [
  ...eventVariables,
  ...articleVariables,
  ...actorVariables,
];

export const webhookVariablesByEvent = {
  [WebhookEventType.ArticlePublished]: articlePublishedVariables,
  [WebhookEventType.ArticleUpdated]: articleUpdatedVariables,
  [WebhookEventType.CommentCreated]: commentCreatedVariables,
  [WebhookEventType.ArticleLiked]: articleLikedVariables,
} as const;

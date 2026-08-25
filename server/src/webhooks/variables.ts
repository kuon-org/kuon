import { WebhookEventType } from "./events.js";

export type WebhookVariableDefinition = {
  key: string;
  label: string;
  group: "Event" | "Article" | "Author";
};

export const articlePublishedVariables: readonly WebhookVariableDefinition[] = [
  { key: "event.type", label: "Event type", group: "Event" },
  { key: "event.createdAt", label: "Created at", group: "Event" },
  { key: "article.id", label: "Article ID", group: "Article" },
  { key: "article.title", label: "Article title", group: "Article" },
  { key: "article.summary", label: "Article summary", group: "Article" },
  { key: "article.url", label: "Article URL", group: "Article" },
  { key: "author.username", label: "Author username", group: "Author" },
  {
    key: "author.displayName",
    label: "Author display name",
    group: "Author",
  },
  { key: "author.avatarUrl", label: "Author avatar URL", group: "Author" },
] as const;

export const webhookVariablesByEvent = {
  [WebhookEventType.ArticlePublished]: articlePublishedVariables,
} as const;

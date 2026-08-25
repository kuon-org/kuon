import { WebhookEventType } from "./events.js";
import type { WebhookProvider } from "./types.js";

export type WebhookPreset = {
  id: string;
  event: WebhookEventType;
  provider: WebhookProvider;
  name: string;
  description: string;
  payloadTemplate: unknown;
};

const presetsForArticleEvent = (
  event: typeof WebhookEventType.ArticlePublished | typeof WebhookEventType.ArticleUpdated,
  actionLabel: string,
): WebhookPreset[] => [
  {
    id: `${event}-generic`,
    event,
    provider: "generic",
    name: `Generic JSON - ${actionLabel}`,
    description: `記事${actionLabel}イベントを汎用JSONとして送信します`,
    payloadTemplate: {
      event: "{{event.type}}",
      title: "{{article.title}}",
      summary: "{{article.summary}}",
      url: "{{article.url}}",
      username:
        event === WebhookEventType.ArticlePublished
          ? "{{author.username}}"
          : "{{actor.username}}",
    },
  },
  {
    id: `${event}-discord`,
    event,
    provider: "discord",
    name: `Discord - ${actionLabel}`,
    description: `Discord向けの記事${actionLabel}通知です`,
    payloadTemplate: {
      embeds: [
        {
          title: "{{article.title}}",
          description: "{{article.summary}}",
          url: "{{article.url}}",
          author: {
            name:
              event === WebhookEventType.ArticlePublished
                ? "{{author.displayName}}"
                : "{{actor.displayName}}",
            icon_url:
              event === WebhookEventType.ArticlePublished
                ? "{{author.avatarUrl}}"
                : "{{actor.avatarUrl}}",
          },
        },
      ],
    },
  },
  {
    id: `${event}-slack`,
    event,
    provider: "slack",
    name: `Slack - ${actionLabel}`,
    description: `Slack向けの記事${actionLabel}通知です`,
    payloadTemplate: {
      text: `*{{article.title}}*\n{{article.summary}}\n<{{article.url}}|Kuonで記事を開く>`,
    },
  },
  {
    id: `${event}-teams`,
    event,
    provider: "teams",
    name: `Microsoft Teams - ${actionLabel}`,
    description: `Teams向けの記事${actionLabel}通知です`,
    payloadTemplate: {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                text: "{{article.title}}",
                weight: "Bolder",
                size: "Medium",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: "{{article.summary}}",
                wrap: true,
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "Kuonで記事を開く",
                url: "{{article.url}}",
              },
            ],
          },
        },
      ],
    },
  },
];

const commentCreatedPresets: WebhookPreset[] = [
  {
    id: "comment.created-generic",
    event: WebhookEventType.CommentCreated,
    provider: "generic",
    name: "Generic JSON - Comment created",
    description: "コメント投稿イベントを汎用JSONとして送信します",
    payloadTemplate: {
      event: "{{event.type}}",
      articleTitle: "{{article.title}}",
      articleUrl: "{{article.url}}",
      commentId: "{{comment.id}}",
      commentBody: "{{comment.body}}",
      username: "{{actor.username}}",
    },
  },
  {
    id: "comment.created-discord",
    event: WebhookEventType.CommentCreated,
    provider: "discord",
    name: "Discord - Comment created",
    description: "Discord向けのコメント投稿通知です",
    payloadTemplate: {
      embeds: [
        {
          title: "{{article.title}} にコメントが投稿されました",
          description: "{{comment.body}}",
          url: "{{article.url}}",
          author: {
            name: "{{actor.displayName}}",
            icon_url: "{{actor.avatarUrl}}",
          },
        },
      ],
    },
  },
  {
    id: "comment.created-slack",
    event: WebhookEventType.CommentCreated,
    provider: "slack",
    name: "Slack - Comment created",
    description: "Slack向けのコメント投稿通知です",
    payloadTemplate: {
      text: "*{{actor.displayName}}* が *{{article.title}}* にコメントしました\n{{comment.body}}\n<{{article.url}}|Kuonで記事を開く>",
    },
  },
  {
    id: "comment.created-teams",
    event: WebhookEventType.CommentCreated,
    provider: "teams",
    name: "Microsoft Teams - Comment created",
    description: "Teams向けのコメント投稿通知です",
    payloadTemplate: {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                text: "{{article.title}} にコメントが投稿されました",
                weight: "Bolder",
                wrap: true,
              },
              { type: "TextBlock", text: "{{comment.body}}", wrap: true },
              {
                type: "TextBlock",
                text: "{{actor.displayName}}",
                isSubtle: true,
                wrap: true,
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "Kuonで記事を開く",
                url: "{{article.url}}",
              },
            ],
          },
        },
      ],
    },
  },
];

const articleLikedPresets: WebhookPreset[] = [
  {
    id: "article.liked-generic",
    event: WebhookEventType.ArticleLiked,
    provider: "generic",
    name: "Generic JSON - Article liked",
    description: "記事いいねイベントを汎用JSONとして送信します",
    payloadTemplate: {
      event: "{{event.type}}",
      articleTitle: "{{article.title}}",
      articleUrl: "{{article.url}}",
      username: "{{actor.username}}",
    },
  },
  {
    id: "article.liked-discord",
    event: WebhookEventType.ArticleLiked,
    provider: "discord",
    name: "Discord - Article liked",
    description: "Discord向けの記事いいね通知です",
    payloadTemplate: {
      content: "👍 **{{actor.displayName}}** が **{{article.title}}** にいいねしました\n{{article.url}}",
    },
  },
  {
    id: "article.liked-slack",
    event: WebhookEventType.ArticleLiked,
    provider: "slack",
    name: "Slack - Article liked",
    description: "Slack向けの記事いいね通知です",
    payloadTemplate: {
      text: "👍 *{{actor.displayName}}* が *{{article.title}}* にいいねしました\n<{{article.url}}|Kuonで記事を開く>",
    },
  },
  {
    id: "article.liked-teams",
    event: WebhookEventType.ArticleLiked,
    provider: "teams",
    name: "Microsoft Teams - Article liked",
    description: "Teams向けの記事いいね通知です",
    payloadTemplate: {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                text: "👍 {{actor.displayName}} が {{article.title}} にいいねしました",
                wrap: true,
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "Kuonで記事を開く",
                url: "{{article.url}}",
              },
            ],
          },
        },
      ],
    },
  },
];

export const webhookPresets: readonly WebhookPreset[] = [
  ...presetsForArticleEvent(WebhookEventType.ArticlePublished, "公開"),
  ...presetsForArticleEvent(WebhookEventType.ArticleUpdated, "更新"),
  ...commentCreatedPresets,
  ...articleLikedPresets,
];

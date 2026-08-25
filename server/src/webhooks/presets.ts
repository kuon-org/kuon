import type { WebhookProvider } from "./types.js";

export type WebhookPreset = {
  id: string;
  provider: WebhookProvider;
  name: string;
  description: string;
  payloadTemplate: unknown;
};

export const webhookPresets: readonly WebhookPreset[] = [
  {
    id: "generic-basic",
    provider: "generic",
    name: "Generic JSON",
    description: "記事情報をフラットなJSONとして送信します",
    payloadTemplate: {
      event: "{{event.type}}",
      title: "{{article.title}}",
      summary: "{{article.summary}}",
      url: "{{article.url}}",
      username: "{{author.username}}",
    },
  },
  {
    id: "discord-embed",
    provider: "discord",
    name: "Discord Embed",
    description: "Discord Webhook向けのEmbedカードです",
    payloadTemplate: {
      embeds: [
        {
          title: "{{article.title}}",
          description: "{{article.summary}}",
          url: "{{article.url}}",
          author: {
            name: "{{author.displayName}}",
            icon_url: "{{author.avatarUrl}}",
          },
        },
      ],
    },
  },
  {
    id: "slack-block-kit",
    provider: "slack",
    name: "Slack Block Kit",
    description: "Slack Incoming Webhook向けのBlock Kitです",
    payloadTemplate: {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "{{article.title}}",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "{{article.summary}}",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "<{{article.url}}|Kuonで記事を開く>",
          },
        },
      ],
    },
  },
  {
    id: "teams-adaptive-card",
    provider: "teams",
    name: "Microsoft Teams Adaptive Card",
    description: "Teams Incoming Webhook向けのAdaptive Cardです",
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
] as const;

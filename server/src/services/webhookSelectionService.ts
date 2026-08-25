import prisma from "../prisma/client.js";
import { ServerSettingKey } from "../constants/serverSettings.js";
import { serverSettingsService } from "./serverSettingsService.js";
import { WebhookEventType } from "../webhooks/events.js";

export type SelectableWebhook = {
  id: string;
  name: string;
  provider: "generic" | "discord" | "slack" | "teams";
  scope: "system" | "user";
};

export class WebhookSelectionService {
  async getArticlePublishedTargets(userId: string): Promise<SelectableWebhook[]> {
    if (!serverSettingsService.isEnabled(ServerSettingKey.WebhooksEnabled)) {
      return [];
    }

    const allowUserWebhooks = serverSettingsService.isEnabled(
      ServerSettingKey.AllowUserWebhooks,
    );

    return prisma.$queryRawUnsafe<SelectableWebhook[]>(
      `
        SELECT DISTINCT w.id, w.name, w.provider, w.scope
        FROM knowledge.webhooks w
        INNER JOIN knowledge.webhook_events e
          ON e.webhook_id = w.id
        WHERE w.is_active = TRUE
          AND e.event_type = $1
          AND (
            w.scope = 'system'
            OR ($3 = TRUE AND w.scope = 'user' AND w.owner_user_id = $2::uuid)
          )
        ORDER BY w.name ASC
      `,
      WebhookEventType.ArticlePublished,
      userId,
      allowUserWebhooks,
    );
  }
}

export const webhookSelectionService = new WebhookSelectionService();

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

    const rows = await prisma.webhooks.findMany({
      where: {
        is_active: true,
        event_type: WebhookEventType.ArticlePublished,
        OR: [
          { scope: "system" },
          ...(allowUserWebhooks
            ? [{ scope: "user", owner_user_id: userId }]
            : []),
        ],
      },
      select: {
        id: true,
        name: true,
        provider: true,
        scope: true,
      },
      orderBy: { name: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      provider: row.provider as SelectableWebhook["provider"],
      scope: row.scope as SelectableWebhook["scope"],
    }));
  }
}

export const webhookSelectionService = new WebhookSelectionService();

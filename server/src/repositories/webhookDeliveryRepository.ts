import prisma from "../prisma/client.js";
import type { WebhookEventType, WebhookScope } from "../webhooks/events.js";

export type WebhookDeliveryTarget = {
  id: string;
  scope: WebhookScope;
  ownerUserId: string | null;
  url: string;
  httpMethod: string;
  payloadTemplate: unknown;
  headers: Array<{
    name: string;
    value: string;
  }>;
};

export class WebhookDeliveryRepository {
  async findActiveTargets(
    eventType: WebhookEventType,
    ownerUserId?: string,
  ): Promise<WebhookDeliveryTarget[]> {
    const rows = await prisma.webhooks.findMany({
      where: {
        is_active: true,
        webhook_events: { some: { event_type: eventType } },
        OR: [
          { scope: "system" },
          ...(ownerUserId
            ? [{ scope: "user", owner_user_id: ownerUserId }]
            : []),
        ],
      },
      include: {
        webhook_headers: { orderBy: { created_at: "asc" } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      scope: row.scope as WebhookScope,
      ownerUserId: row.owner_user_id,
      url: row.url,
      httpMethod: row.http_method,
      payloadTemplate: row.payload_template,
      headers: row.webhook_headers.map((header) => ({
        name: header.name,
        value: header.value,
      })),
    }));
  }

  async recordDelivery(input: {
    webhookId: string;
    eventType: WebhookEventType;
    success: boolean;
    statusCode?: number;
    durationMs: number;
    errorMessage?: string;
  }): Promise<void> {
    await prisma.webhook_deliveries.create({
      data: {
        webhook_id: input.webhookId,
        event_type: input.eventType,
        success: input.success,
        status_code: input.statusCode ?? null,
        duration_ms: input.durationMs,
        error_message: input.errorMessage ?? null,
      },
    });
  }
}

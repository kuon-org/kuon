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
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        scope: WebhookScope;
        owner_user_id: string | null;
        url: string;
        http_method: string;
        payload_template: unknown;
      }>
    >(
      `
        SELECT DISTINCT
          w.id,
          w.scope,
          w.owner_user_id,
          w.url,
          w.http_method,
          w.payload_template
        FROM knowledge.webhooks w
        INNER JOIN knowledge.webhook_events e
          ON e.webhook_id = w.id
        WHERE w.is_active = TRUE
          AND e.event_type = $1
          AND (
            w.scope = 'system'
            OR (w.scope = 'user' AND w.owner_user_id = $2::uuid)
          )
      `,
      eventType,
      ownerUserId ?? null,
    );

    const targets: WebhookDeliveryTarget[] = [];
    for (const row of rows) {
      const headers = await prisma.$queryRawUnsafe<
        Array<{ name: string; value: string }>
      >(
        `
          SELECT name, value
          FROM knowledge.webhook_headers
          WHERE webhook_id = $1::uuid
          ORDER BY created_at ASC
        `,
        row.id,
      );

      targets.push({
        id: row.id,
        scope: row.scope,
        ownerUserId: row.owner_user_id,
        url: row.url,
        httpMethod: row.http_method,
        payloadTemplate: row.payload_template,
        headers,
      });
    }

    return targets;
  }

  async recordDelivery(input: {
    webhookId: string;
    eventType: WebhookEventType;
    success: boolean;
    statusCode?: number;
    durationMs: number;
    errorMessage?: string;
  }): Promise<void> {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO knowledge.webhook_deliveries (
          webhook_id,
          event_type,
          success,
          status_code,
          duration_ms,
          error_message
        )
        VALUES ($1::uuid, $2, $3, $4, $5, $6)
      `,
      input.webhookId,
      input.eventType,
      input.success,
      input.statusCode ?? null,
      input.durationMs,
      input.errorMessage ?? null,
    );
  }
}

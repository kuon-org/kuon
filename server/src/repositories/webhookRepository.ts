import prisma from "../prisma/client.js";
import type {
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDeliveryRecord,
  WebhookDetail,
  WebhookHeaderInput,
  WebhookRecord,
} from "../webhooks/types.js";
import type { WebhookEventType } from "../webhooks/events.js";

type WebhookRow = {
  id: string;
  name: string;
  scope: "system" | "user";
  owner_user_id: string | null;
  provider: "generic" | "discord" | "slack" | "teams";
  url: string;
  http_method: string;
  payload_template: unknown;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

const toRecord = (row: WebhookRow): WebhookRecord => ({
  id: row.id,
  name: row.name,
  scope: row.scope,
  ownerUserId: row.owner_user_id,
  provider: row.provider,
  url: row.url,
  httpMethod: row.http_method,
  payloadTemplate: row.payload_template,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class WebhookRepository {
  async findAll(): Promise<WebhookRecord[]> {
    const rows = await prisma.$queryRawUnsafe<WebhookRow[]>(`
      SELECT id, name, scope, owner_user_id, provider, url, http_method,
             payload_template, is_active, created_at, updated_at
      FROM knowledge.webhooks
      ORDER BY created_at DESC
    `);

    return rows.map(toRecord);
  }

  async findById(id: string): Promise<WebhookRecord | null> {
    const rows = await prisma.$queryRawUnsafe<WebhookRow[]>(
      `
        SELECT id, name, scope, owner_user_id, provider, url, http_method,
               payload_template, is_active, created_at, updated_at
        FROM knowledge.webhooks
        WHERE id = $1::uuid
      `,
      id,
    );

    return rows[0] ? toRecord(rows[0]) : null;
  }

  async findDetailById(id: string): Promise<WebhookDetail | null> {
    const webhook = await this.findById(id);
    if (!webhook) return null;

    const [events, headers] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ event_type: WebhookEventType }>>(
        `SELECT event_type FROM knowledge.webhook_events WHERE webhook_id = $1::uuid ORDER BY event_type`,
        id,
      ),
      prisma.$queryRawUnsafe<
        Array<{ name: string; value: string; is_secret: boolean }>
      >(
        `SELECT name, value, is_secret FROM knowledge.webhook_headers WHERE webhook_id = $1::uuid ORDER BY name`,
        id,
      ),
    ]);

    return {
      ...webhook,
      events: events.map((row) => row.event_type),
      headers: headers.map(
        (row): WebhookHeaderInput => ({
          name: row.name,
          value: row.value,
          isSecret: row.is_secret,
        }),
      ),
    };
  }

  async create(input: CreateWebhookInput): Promise<WebhookDetail> {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<WebhookRow[]>(
        `
          INSERT INTO knowledge.webhooks (
            name, scope, owner_user_id, provider, url, http_method, payload_template
          )
          VALUES ($1, $2, $3::uuid, $4, $5, $6, $7::jsonb)
          RETURNING id, name, scope, owner_user_id, provider, url, http_method,
                    payload_template, is_active, created_at, updated_at
        `,
        input.name.trim(),
        input.scope,
        input.ownerUserId ?? null,
        input.provider,
        input.url,
        input.httpMethod ?? "POST",
        JSON.stringify(input.payloadTemplate ?? {}),
      );

      const row = rows[0];
      if (!row) throw new Error("Webhookの作成に失敗しました");

      await this.replaceChildren(tx, row.id, input.events, input.headers ?? []);

      return {
        ...toRecord(row),
        events: input.events,
        headers: input.headers ?? [],
      };
    });
  }

  async update(id: string, input: UpdateWebhookInput): Promise<WebhookDetail> {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<WebhookRow[]>(
        `
          UPDATE knowledge.webhooks
          SET name = $2,
              scope = $3,
              owner_user_id = $4::uuid,
              provider = $5,
              url = $6,
              http_method = $7,
              payload_template = $8::jsonb,
              is_active = $9,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1::uuid
          RETURNING id, name, scope, owner_user_id, provider, url, http_method,
                    payload_template, is_active, created_at, updated_at
        `,
        id,
        input.name.trim(),
        input.scope,
        input.ownerUserId ?? null,
        input.provider,
        input.url,
        input.httpMethod ?? "POST",
        JSON.stringify(input.payloadTemplate ?? {}),
        input.isActive,
      );

      const row = rows[0];
      if (!row) throw new Error("Webhookが見つかりません");

      await this.replaceChildren(tx, id, input.events, input.headers ?? []);

      return {
        ...toRecord(row),
        events: input.events,
        headers: input.headers ?? [],
      };
    });
  }

  async setActive(id: string, isActive: boolean): Promise<WebhookRecord> {
    const rows = await prisma.$queryRawUnsafe<WebhookRow[]>(
      `
        UPDATE knowledge.webhooks
        SET is_active = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid
        RETURNING id, name, scope, owner_user_id, provider, url, http_method,
                  payload_template, is_active, created_at, updated_at
      `,
      id,
      isActive,
    );

    if (!rows[0]) throw new Error("Webhookが見つかりません");
    return toRecord(rows[0]);
  }

  async findDeliveries(
    webhookId: string,
    limit = 50,
  ): Promise<WebhookDeliveryRecord[]> {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        webhook_id: string;
        event_type: string;
        success: boolean;
        status_code: number | null;
        duration_ms: number | null;
        error_message: string | null;
        created_at: Date;
      }>
    >(
      `
        SELECT id, webhook_id, event_type, success, status_code, duration_ms,
               error_message, created_at
        FROM knowledge.webhook_deliveries
        WHERE webhook_id = $1::uuid
        ORDER BY created_at DESC
        LIMIT $2
      `,
      webhookId,
      Math.max(1, Math.min(limit, 200)),
    );

    return rows.map((row) => ({
      id: row.id,
      webhookId: row.webhook_id,
      eventType: row.event_type,
      success: row.success,
      statusCode: row.status_code,
      durationMs: row.duration_ms,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    }));
  }

  async delete(id: string): Promise<void> {
    await prisma.$executeRawUnsafe(
      `DELETE FROM knowledge.webhooks WHERE id = $1::uuid`,
      id,
    );
  }

  private async replaceChildren(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    webhookId: string,
    events: WebhookEventType[],
    headers: WebhookHeaderInput[],
  ) {
    await tx.$executeRawUnsafe(
      `DELETE FROM knowledge.webhook_events WHERE webhook_id = $1::uuid`,
      webhookId,
    );
    await tx.$executeRawUnsafe(
      `DELETE FROM knowledge.webhook_headers WHERE webhook_id = $1::uuid`,
      webhookId,
    );

    for (const eventType of events) {
      await tx.$executeRawUnsafe(
        `INSERT INTO knowledge.webhook_events (webhook_id, event_type) VALUES ($1::uuid, $2)`,
        webhookId,
        eventType,
      );
    }

    for (const header of headers) {
      await tx.$executeRawUnsafe(
        `
          INSERT INTO knowledge.webhook_headers (webhook_id, name, value, is_secret)
          VALUES ($1::uuid, $2, $3, $4)
        `,
        webhookId,
        header.name.trim(),
        header.value,
        header.isSecret ?? false,
      );
    }
  }
}

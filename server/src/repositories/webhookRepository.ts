import prisma from "../prisma/client.js";
import type {
  CreateWebhookInput,
  WebhookRecord,
} from "../webhooks/types.js";

export class WebhookRepository {
  async findAll(): Promise<WebhookRecord[]> {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
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
      }>
    >(`
      SELECT
        id,
        name,
        scope,
        owner_user_id,
        provider,
        url,
        http_method,
        payload_template,
        is_active,
        created_at,
        updated_at
      FROM knowledge.webhooks
      ORDER BY created_at DESC
    `);

    return rows.map((row) => ({
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
    }));
  }

  async findById(id: string): Promise<WebhookRecord | null> {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
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
      }>
    >(
      `
        SELECT
          id,
          name,
          scope,
          owner_user_id,
          provider,
          url,
          http_method,
          payload_template,
          is_active,
          created_at,
          updated_at
        FROM knowledge.webhooks
        WHERE id = $1::uuid
      `,
      id,
    );

    const row = rows[0];
    if (!row) return null;

    return {
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
    };
  }

  async create(input: CreateWebhookInput): Promise<WebhookRecord> {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<
        Array<{
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
        }>
      >(
        `
          INSERT INTO knowledge.webhooks (
            name,
            scope,
            owner_user_id,
            provider,
            url,
            http_method,
            payload_template
          )
          VALUES ($1, $2, $3::uuid, $4, $5, $6, $7::jsonb)
          RETURNING
            id,
            name,
            scope,
            owner_user_id,
            provider,
            url,
            http_method,
            payload_template,
            is_active,
            created_at,
            updated_at
        `,
        input.name.trim(),
        input.scope,
        input.ownerUserId ?? null,
        input.provider,
        input.url,
        input.httpMethod ?? "POST",
        JSON.stringify(input.payloadTemplate ?? {}),
      );

      const webhook = rows[0];
      if (!webhook) {
        throw new Error("Webhookの作成に失敗しました");
      }

      for (const eventType of input.events) {
        await tx.$executeRawUnsafe(
          `
            INSERT INTO knowledge.webhook_events (webhook_id, event_type)
            VALUES ($1::uuid, $2)
          `,
          webhook.id,
          eventType,
        );
      }

      for (const header of input.headers ?? []) {
        await tx.$executeRawUnsafe(
          `
            INSERT INTO knowledge.webhook_headers (
              webhook_id,
              name,
              value,
              is_secret
            )
            VALUES ($1::uuid, $2, $3, $4)
          `,
          webhook.id,
          header.name.trim(),
          header.value,
          header.isSecret ?? false,
        );
      }

      return {
        id: webhook.id,
        name: webhook.name,
        scope: webhook.scope,
        ownerUserId: webhook.owner_user_id,
        provider: webhook.provider,
        url: webhook.url,
        httpMethod: webhook.http_method,
        payloadTemplate: webhook.payload_template,
        isActive: webhook.is_active,
        createdAt: webhook.created_at,
        updatedAt: webhook.updated_at,
      };
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.$executeRawUnsafe(
      `DELETE FROM knowledge.webhooks WHERE id = $1::uuid`,
      id,
    );
  }
}

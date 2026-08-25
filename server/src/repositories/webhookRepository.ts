import type { Prisma, webhooks } from "@prisma/client";
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

const toRecord = (row: webhooks): WebhookRecord => ({
  id: row.id,
  name: row.name,
  scope: row.scope as WebhookRecord["scope"],
  ownerUserId: row.owner_user_id,
  provider: row.provider as WebhookRecord["provider"],
  url: row.url,
  httpMethod: row.http_method,
  payloadTemplate: row.payload_template,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class WebhookRepository {
  async findAll(): Promise<WebhookRecord[]> {
    const rows = await prisma.webhooks.findMany({ orderBy: { created_at: "desc" } });
    return rows.map(toRecord);
  }

  async findAllByOwner(ownerUserId: string): Promise<WebhookRecord[]> {
    const rows = await prisma.webhooks.findMany({
      where: { scope: "user", owner_user_id: ownerUserId },
      orderBy: { created_at: "desc" },
    });
    return rows.map(toRecord);
  }

  async findById(id: string): Promise<WebhookRecord | null> {
    const row = await prisma.webhooks.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findDetailById(id: string): Promise<WebhookDetail | null> {
    return this.findDetail({ id });
  }

  async findDetailByOwner(id: string, ownerUserId: string): Promise<WebhookDetail | null> {
    return this.findDetail({ id, scope: "user", owner_user_id: ownerUserId });
  }

  private async findDetail(where: Prisma.webhooksWhereInput): Promise<WebhookDetail | null> {
    const row = await prisma.webhooks.findFirst({
      where,
      include: {
        webhook_events: { orderBy: { event_type: "asc" } },
        webhook_headers: { orderBy: { name: "asc" } },
      },
    });
    if (!row) return null;

    return {
      ...toRecord(row),
      events: row.webhook_events.map((event) => event.event_type as WebhookEventType),
      headers: row.webhook_headers.map((header): WebhookHeaderInput => ({
        name: header.name,
        value: header.value,
        isSecret: header.is_secret,
      })),
    };
  }

  async create(input: CreateWebhookInput): Promise<WebhookDetail> {
    return prisma.$transaction(async (tx) => {
      const row = await tx.webhooks.create({
        data: {
          name: input.name.trim(),
          scope: input.scope,
          owner_user_id: input.ownerUserId ?? null,
          provider: input.provider,
          url: input.url,
          http_method: input.httpMethod ?? "POST",
          payload_template: (input.payloadTemplate ?? {}) as Prisma.InputJsonValue,
        },
      });
      await this.replaceChildren(tx, row.id, input.events, input.headers ?? []);
      return { ...toRecord(row), events: input.events, headers: input.headers ?? [] };
    });
  }

  async update(id: string, input: UpdateWebhookInput): Promise<WebhookDetail> {
    return this.updateWhere({ id }, id, input);
  }

  async updateByOwner(id: string, ownerUserId: string, input: UpdateWebhookInput): Promise<WebhookDetail | null> {
    const existing = await prisma.webhooks.findFirst({
      where: { id, scope: "user", owner_user_id: ownerUserId },
      select: { id: true },
    });
    if (!existing) return null;
    return this.updateWhere({ id }, id, input);
  }

  private async updateWhere(_where: Prisma.webhooksWhereInput, id: string, input: UpdateWebhookInput): Promise<WebhookDetail> {
    return prisma.$transaction(async (tx) => {
      const row = await tx.webhooks.update({
        where: { id },
        data: {
          name: input.name.trim(),
          scope: input.scope,
          owner_user_id: input.ownerUserId ?? null,
          provider: input.provider,
          url: input.url,
          http_method: input.httpMethod ?? "POST",
          payload_template: (input.payloadTemplate ?? {}) as Prisma.InputJsonValue,
          is_active: input.isActive,
          updated_at: new Date(),
        },
      });
      await this.replaceChildren(tx, id, input.events, input.headers ?? []);
      return { ...toRecord(row), events: input.events, headers: input.headers ?? [] };
    });
  }

  async setActive(id: string, isActive: boolean): Promise<WebhookRecord> {
    const row = await prisma.webhooks.update({ where: { id }, data: { is_active: isActive, updated_at: new Date() } });
    return toRecord(row);
  }

  async setActiveByOwner(id: string, ownerUserId: string, isActive: boolean): Promise<WebhookRecord | null> {
    const existing = await prisma.webhooks.findFirst({
      where: { id, scope: "user", owner_user_id: ownerUserId },
      select: { id: true },
    });
    if (!existing) return null;
    return this.setActive(id, isActive);
  }

  async findDeliveries(webhookId: string, limit = 50): Promise<WebhookDeliveryRecord[]> {
    const rows = await prisma.webhook_deliveries.findMany({
      where: { webhook_id: webhookId },
      orderBy: { created_at: "desc" },
      take: Math.max(1, Math.min(limit, 200)),
    });
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

  async findDeliveriesByOwner(webhookId: string, ownerUserId: string, limit = 50): Promise<WebhookDeliveryRecord[] | null> {
    const owned = await prisma.webhooks.findFirst({
      where: { id: webhookId, scope: "user", owner_user_id: ownerUserId },
      select: { id: true },
    });
    if (!owned) return null;
    return this.findDeliveries(webhookId, limit);
  }

  async delete(id: string): Promise<void> {
    await prisma.webhooks.delete({ where: { id } });
  }

  async deleteByOwner(id: string, ownerUserId: string): Promise<boolean> {
    const result = await prisma.webhooks.deleteMany({
      where: { id, scope: "user", owner_user_id: ownerUserId },
    });
    return result.count > 0;
  }

  private async replaceChildren(tx: Prisma.TransactionClient, webhookId: string, events: WebhookEventType[], headers: WebhookHeaderInput[]) {
    await tx.webhook_events.deleteMany({ where: { webhook_id: webhookId } });
    await tx.webhook_headers.deleteMany({ where: { webhook_id: webhookId } });
    if (events.length > 0) {
      await tx.webhook_events.createMany({ data: events.map((eventType) => ({ webhook_id: webhookId, event_type: eventType })) });
    }
    if (headers.length > 0) {
      await tx.webhook_headers.createMany({
        data: headers.map((header) => ({
          webhook_id: webhookId,
          name: header.name.trim(),
          value: header.value,
          is_secret: header.isSecret ?? false,
        })),
      });
    }
  }
}

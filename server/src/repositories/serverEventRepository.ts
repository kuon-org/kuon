import { Prisma } from "@prisma/client";
import prisma from "../prisma/client.js";

export type ServerEventLevel = "info" | "warning" | "error";
export type ServerEventCategory = "system" | "audit";

export interface ServerEventRecord {
  id: string;
  category: ServerEventCategory;
  event_type: string;
  level: ServerEventLevel;
  source: string | null;
  message: string;
  metadata: unknown;
  actor_user_id: string | null;
  ip_address: string | null;
  subject_type: string | null;
  subject_id: string | null;
  before_data: unknown;
  after_data: unknown;
  correlation_id: string | null;
  created_at: Date;
}

export interface ServerEventFilters {
  level?: ServerEventLevel;
  eventType?: string;
  category?: ServerEventCategory;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface CreateServerEventInput {
  category?: ServerEventCategory;
  eventType: string;
  level: ServerEventLevel;
  source?: string | null;
  message: string;
  metadata?: unknown;
  actorUserId?: string | null;
  ipAddress?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  before?: unknown;
  after?: unknown;
  correlationId?: string | null;
}

const asJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;

const toRecord = (event: Awaited<ReturnType<typeof prisma.server_events.findFirstOrThrow>>): ServerEventRecord => ({
  ...event,
  category: event.category as ServerEventCategory,
  level: event.level as ServerEventLevel,
});

export class ServerEventRepository {
  async create(input: CreateServerEventInput) {
    const event = await prisma.server_events.create({
      data: {
        category: input.category ?? "system",
        event_type: input.eventType,
        level: input.level,
        source: input.source ?? null,
        message: input.message,
        metadata: asJson(input.metadata ?? {}),
        actor_user_id: input.actorUserId ?? null,
        ip_address: input.ipAddress ?? null,
        subject_type: input.subjectType ?? null,
        subject_id: input.subjectId ?? null,
        ...(input.before === undefined ? {} : { before_data: asJson(input.before) }),
        ...(input.after === undefined ? {} : { after_data: asJson(input.after) }),
        correlation_id: input.correlationId ?? null,
      },
    });
    return toRecord(event);
  }

  async findById(id: string) {
    const event = await prisma.server_events.findUnique({ where: { id } });
    return event ? toRecord(event) : null;
  }

  async findMany(filters: ServerEventFilters) {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
    const where: Prisma.server_eventsWhereInput = {
      ...(filters.level ? { level: filters.level } : {}),
      ...(filters.eventType ? { event_type: filters.eventType } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.from || filters.to
        ? {
            created_at: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const [events, total] = await Promise.all([
      prisma.server_events.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.server_events.count({ where }),
    ]);

    return {
      events: events.map(toRecord),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const serverEventRepository = new ServerEventRepository();

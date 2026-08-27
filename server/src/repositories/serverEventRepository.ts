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

export class ServerEventRepository {
  async create(input: CreateServerEventInput) {
    const rows = await prisma.$queryRaw<ServerEventRecord[]>`
      INSERT INTO knowledge.server_events (
        category, event_type, level, source, message, metadata,
        actor_user_id, ip_address, subject_type, subject_id,
        before_data, after_data, correlation_id
      ) VALUES (
        ${input.category ?? "system"},
        ${input.eventType},
        ${input.level},
        ${input.source ?? null},
        ${input.message},
        ${JSON.stringify(input.metadata ?? {})}::jsonb,
        ${input.actorUserId ?? null}::uuid,
        ${input.ipAddress ?? null}::inet,
        ${input.subjectType ?? null},
        ${input.subjectId ?? null}::uuid,
        ${input.before === undefined ? null : JSON.stringify(input.before)}::jsonb,
        ${input.after === undefined ? null : JSON.stringify(input.after)}::jsonb,
        ${input.correlationId ?? null}::uuid
      )
      RETURNING *
    `;
    return rows[0];
  }

  async findById(id: string) {
    const rows = await prisma.$queryRaw<ServerEventRecord[]>`
      SELECT * FROM knowledge.server_events
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async findMany(filters: ServerEventFilters) {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
    const offset = (page - 1) * limit;

    const rows = await prisma.$queryRaw<ServerEventRecord[]>`
      SELECT *
      FROM knowledge.server_events
      WHERE (${filters.level ?? null}::text IS NULL OR level = ${filters.level ?? null})
        AND (${filters.eventType ?? null}::text IS NULL OR event_type = ${filters.eventType ?? null})
        AND (${filters.category ?? null}::text IS NULL OR category = ${filters.category ?? null})
        AND (${filters.from?.toISOString() ?? null}::timestamptz IS NULL OR created_at >= ${filters.from?.toISOString() ?? null}::timestamptz)
        AND (${filters.to?.toISOString() ?? null}::timestamptz IS NULL OR created_at <= ${filters.to?.toISOString() ?? null}::timestamptz)
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count
      FROM knowledge.server_events
      WHERE (${filters.level ?? null}::text IS NULL OR level = ${filters.level ?? null})
        AND (${filters.eventType ?? null}::text IS NULL OR event_type = ${filters.eventType ?? null})
        AND (${filters.category ?? null}::text IS NULL OR category = ${filters.category ?? null})
        AND (${filters.from?.toISOString() ?? null}::timestamptz IS NULL OR created_at >= ${filters.from?.toISOString() ?? null}::timestamptz)
        AND (${filters.to?.toISOString() ?? null}::timestamptz IS NULL OR created_at <= ${filters.to?.toISOString() ?? null}::timestamptz)
    `;

    const total = Number(countRows[0]?.count ?? 0);
    return {
      events: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const serverEventRepository = new ServerEventRepository();

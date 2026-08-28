import {
  serverEventRepository,
  type CreateServerEventInput,
  type ServerEventLevel,
} from "../repositories/serverEventRepository.js";

type EventLoggerOptions = Omit<CreateServerEventInput, "eventType" | "level">;

const SENSITIVE_KEY_PATTERN =
  /(password|token|secret|cookie|authorization|api[_-]?key)/i;

const sanitize = (value: unknown): unknown => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitize(nested),
    ]),
  );
};

class EventLogger {
  private async write(
    level: ServerEventLevel,
    eventType: string,
    options: EventLoggerOptions,
  ) {
    try {
      return await serverEventRepository.create({
        ...options,
        eventType,
        level,
        category: options.category ?? "system",
        metadata: sanitize(options.metadata ?? {}),
        before:
          options.before === undefined ? undefined : sanitize(options.before),
        after: options.after === undefined ? undefined : sanitize(options.after),
      });
    } catch (error) {
      // Event logging must never turn an otherwise successful operation into a failure.
      console.error(`[eventLogger] failed to persist ${eventType}`, error);
      return null;
    }
  }

  info(eventType: string, options: EventLoggerOptions) {
    return this.write("info", eventType, options);
  }

  warning(eventType: string, options: EventLoggerOptions) {
    return this.write("warning", eventType, options);
  }

  error(eventType: string, options: EventLoggerOptions) {
    return this.write("error", eventType, options);
  }
}

export const eventLogger = new EventLogger();

import type { NextFunction, Request, Response } from "express";

const DEFAULT_ERROR_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "AUTHENTICATION_REQUIRED",
  403: "PERMISSION_DENIED",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
  503: "SERVICE_UNAVAILABLE",
};

const defaultCodeForStatus = (status: number) =>
  DEFAULT_ERROR_CODES[status] ?? (status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED");

const isStandardErrorResponse = (body: unknown): body is {
  error: { code: string; message?: string; details?: unknown };
} => {
  if (!body || typeof body !== "object") return false;
  const error = (body as { error?: unknown }).error;
  return !!error && typeof error === "object" && typeof (error as { code?: unknown }).code === "string";
};

/**
 * During the #79 migration, controllers may still call res.status(...).json()
 * with legacy error bodies. This middleware makes the public API contract
 * consistently expose { error: { code, message, details } }.
 *
 * New code should throw AppError instead of relying on this compatibility path.
 */
export const normalizeApiErrorResponses = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    if (res.statusCode < 400 || isStandardErrorResponse(body)) {
      return originalJson(body);
    }

    const legacy = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const code = typeof legacy.code === "string" ? legacy.code : defaultCodeForStatus(res.statusCode);
    const message =
      typeof legacy.message === "string"
        ? legacy.message
        : typeof legacy.error === "string"
          ? legacy.error
          : undefined;

    const excludedKeys = new Set(["code", "message", "error", "details"]);
    const inferredDetails = Object.fromEntries(
      Object.entries(legacy).filter(([key]) => !excludedKeys.has(key)),
    );
    const details =
      legacy.details !== undefined
        ? legacy.details
        : Object.keys(inferredDetails).length > 0
          ? inferredDetails
          : null;

    return originalJson({
      error: {
        code,
        ...(message ? { message } : {}),
        details,
      },
    });
  }) as Response["json"];

  next();
};

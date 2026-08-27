import type { NextFunction, Request, Response } from "express";
import { eventLogger } from "./eventLogger.js";

const RUNTIME_MAINTENANCE_CODE = "RUNTIME_MAINTENANCE";

class RuntimeMaintenanceService {
  private locked = false;
  private reason: string | null = null;

  isLocked() {
    return this.locked;
  }

  lock(reason: string) {
    if (this.locked) throw new Error("Runtime maintenance lock is already active");
    this.locked = true;
    this.reason = reason;

    void eventLogger.warning("runtime_maintenance.enabled", {
      source: "runtime-maintenance",
      message: "Runtime maintenance mode enabled",
      metadata: { reason },
    });
  }

  unlock() {
    const reason = this.reason;
    this.locked = false;
    this.reason = null;

    void eventLogger.info("runtime_maintenance.disabled", {
      source: "runtime-maintenance",
      message: "Runtime maintenance mode disabled",
      metadata: { reason },
    });
  }

  getReason() {
    return this.reason;
  }
}

export const runtimeMaintenanceService = new RuntimeMaintenanceService();

/**
 * Restore中のDB非依存アクセスゲート。
 * SPA本体は配信し続け、DBや永続データへ触れる経路のみ停止する。
 */
export const runtimeMaintenanceGate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!runtimeMaintenanceService.isLocked()) return next();

  if (req.path === "/api/server/public-settings") return next();

  const guardedPath =
    req.path.startsWith("/api") ||
    req.path.startsWith("/uploads") ||
    req.path.startsWith("/share") ||
    req.path.startsWith("/auth");

  if (!guardedPath) return next();

  return res.status(503).json({
    code: RUNTIME_MAINTENANCE_CODE,
    message: "Kuon restore is currently in progress",
  });
};

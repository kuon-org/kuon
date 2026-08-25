import type { NextFunction, Request, Response } from "express";

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
  }

  unlock() {
    this.locked = false;
    this.reason = null;
  }

  getReason() {
    return this.reason;
  }
}

export const runtimeMaintenanceService = new RuntimeMaintenanceService();

/**
 * Restore中のDB非依存アクセスゲート。
 * public-settingsのみ許可し、開始済みのRestoreリクエスト以外の新規APIを停止する。
 */
export const runtimeMaintenanceGate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!runtimeMaintenanceService.isLocked()) return next();

  if (req.path === "/api/server/public-settings") return next();

  return res.status(503).json({
    code: RUNTIME_MAINTENANCE_CODE,
    message: "Kuon restore is currently in progress",
  });
};

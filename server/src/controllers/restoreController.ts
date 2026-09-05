import type { Response } from "express";
import { rm } from "node:fs/promises";
import { AppError, ValidationError } from "../errors/AppError.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { isAuthenticated } from "../middlewares/auth.js";
import type { RestoreService } from "../services/restoreService.js";
import { eventLogger } from "../services/eventLogger.js";

export class RestoreController {
  constructor(private restoreService: RestoreService) {}

  restoreBackup = async (req: AuthRequest, res: Response) => {
    const uploadedPath = req.file?.path;
    const startedAt = Date.now();

    try {
      if (!isAuthenticated(req)) {
        throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
      }
      if (req.user.sessionId === "apikey") {
        throw new AppError(
          403,
          "RESTORE_API_KEY_FORBIDDEN",
          "Restore is not available with API key authentication",
        );
      }
      if (!uploadedPath) {
        throw new ValidationError({ backup: ["BACKUP_FILE_REQUIRED"] });
      }

      void eventLogger.warning("restore.started", {
        source: "restore",
        actorUserId: req.user.userId,
        ipAddress: req.ip,
        message: "Restore started",
      });

      const result = await this.restoreService.restore(uploadedPath);
      void eventLogger.info("restore.completed", {
        source: "restore",
        actorUserId: req.user.userId,
        ipAddress: req.ip,
        message: "Restore completed successfully",
        metadata: { durationMs: Date.now() - startedAt },
      });
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("❌ Restore failed:", error);
      if (isAuthenticated(req)) {
        void eventLogger.error("restore.failed", {
          source: "restore",
          actorUserId: req.user.userId,
          ipAddress: req.ip,
          message: "Restore failed",
          metadata: {
            durationMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
      throw new AppError(500, "RESTORE_FAILED", "Restore failed");
    } finally {
      if (uploadedPath) {
        await rm(uploadedPath, { force: true }).catch(() => {});
      }
    }
  };
}

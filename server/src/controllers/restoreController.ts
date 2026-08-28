import type { Response } from "express";
import { rm } from "node:fs/promises";
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
        return res.status(401).json({ message: "未ログインです" });
      }
      if (req.user.sessionId === "apikey") {
        return res.status(403).json({ message: "API KeyではRestoreを実行できません" });
      }
      if (!uploadedPath) {
        return res.status(400).json({ message: "バックアップファイルを指定してください" });
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
      return res.status(500).json({
        message:
          error instanceof Error
            ? `復元に失敗しました: ${error.message}`
            : "復元に失敗しました",
      });
    } finally {
      if (uploadedPath) {
        await rm(uploadedPath, { force: true }).catch(() => {});
      }
    }
  };
}

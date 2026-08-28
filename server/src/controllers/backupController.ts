import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import { isAuthenticated } from "../middlewares/auth.js";
import type { BackupService } from "../services/backupService.js";
import { eventLogger } from "../services/eventLogger.js";

export class BackupController {
  constructor(private backupService: BackupService) {}

  exportBackup = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    // Backups contain sensitive instance data and must never be exportable via API keys.
    if (req.user.sessionId === "apikey") {
      return res.status(403).json({ message: "APIキーではバックアップを作成できません" });
    }

    const startedAt = Date.now();
    const eventContext = {
      source: "backup",
      actorUserId: req.user.userId,
      ipAddress: req.ip,
    };
    void eventLogger.info("backup.started", {
      ...eventContext,
      message: "Backup creation started",
    });

    let backup: Awaited<ReturnType<BackupService["createArchive"]>> | null = null;

    try {
      backup = await this.backupService.createArchive();
      void eventLogger.info("backup.completed", {
        ...eventContext,
        message: "Backup created successfully",
        metadata: {
          fileName: backup.fileName,
          durationMs: Date.now() - startedAt,
        },
      });

      res.setHeader("Content-Type", "application/gzip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${backup.fileName}"`,
      );

      return res.download(backup.archivePath, backup.fileName, async (error) => {
        await backup?.cleanup().catch(() => {});
        if (error) {
          void eventLogger.error("backup.download_failed", {
            ...eventContext,
            message: "Backup download failed",
            metadata: { error: error.message },
          });
        }
        if (error && !res.headersSent) {
          res.status(500).json({ message: "バックアップの送信に失敗しました" });
        }
      });
    } catch (error) {
      await backup?.cleanup().catch(() => {});
      void eventLogger.error("backup.failed", {
        ...eventContext,
        message: "Backup creation failed",
        metadata: {
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return res.status(500).json({
        message:
          error instanceof Error
            ? `バックアップの作成に失敗しました: ${error.message}`
            : "バックアップの作成に失敗しました",
      });
    }
  };
}

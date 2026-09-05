import type { Response } from "express";
import { AppError } from "../errors/AppError.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { isAuthenticated } from "../middlewares/auth.js";
import type { BackupService } from "../services/backupService.js";
import { eventLogger } from "../services/eventLogger.js";

export class BackupController {
  constructor(private backupService: BackupService) {}

  exportBackup = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    if (req.user.sessionId === "apikey") {
      throw new AppError(
        403,
        "BACKUP_API_KEY_FORBIDDEN",
        "Backup export is not available with API key authentication",
      );
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
          res.status(500).json({
            error: {
              code: "BACKUP_DOWNLOAD_FAILED",
              message: "Backup download failed",
              details: null,
            },
          });
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
      console.error("Backup creation failed", error);
      throw new AppError(500, "BACKUP_CREATE_FAILED", "Backup creation failed");
    }
  };
}

import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import { isAuthenticated } from "../middlewares/auth.js";
import type { AdminService } from "../services/adminService.js";
import type { BackupService } from "../services/backupService.js";

export class BackupController {
  constructor(
    private adminService: AdminService,
    private backupService: BackupService,
  ) {}

  exportBackup = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    // Backups contain sensitive instance data and must never be exportable via API keys.
    if (req.user.sessionId === "apikey") {
      return res.status(403).json({ message: "APIキーではバックアップを作成できません" });
    }

    const isAdmin = await this.adminService.isAdmin(req.user.userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "権限がありません" });
    }

    let backup: Awaited<ReturnType<BackupService["createArchive"]>> | null = null;

    try {
      backup = await this.backupService.createArchive();
      res.setHeader("Content-Type", "application/gzip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${backup.fileName}"`,
      );

      return res.download(backup.archivePath, backup.fileName, async (error) => {
        await backup?.cleanup().catch(() => {});
        if (error && !res.headersSent) {
          res.status(500).json({ message: "バックアップの送信に失敗しました" });
        }
      });
    } catch (error) {
      await backup?.cleanup().catch(() => {});
      return res.status(500).json({
        message:
          error instanceof Error
            ? `バックアップの作成に失敗しました: ${error.message}`
            : "バックアップの作成に失敗しました",
      });
    }
  };
}

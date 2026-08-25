import type { Response } from "express";
import { rm } from "node:fs/promises";
import type { AuthRequest } from "../middlewares/auth.js";
import { isAuthenticated } from "../middlewares/auth.js";
import type { AdminService } from "../services/adminService.js";
import type { RestoreService } from "../services/restoreService.js";

export class RestoreController {
  constructor(
    private adminService: AdminService,
    private restoreService: RestoreService,
  ) {}

  restoreBackup = async (req: AuthRequest, res: Response) => {
    const uploadedPath = req.file?.path;

    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      if (req.user.sessionId === "apikey") {
        return res.status(403).json({ message: "API KeyではRestoreを実行できません" });
      }

      const isAdmin = await this.adminService.isAdmin(req.user.userId);
      if (!isAdmin) {
        return res.status(403).json({ message: "権限がありません" });
      }
      if (!uploadedPath) {
        return res.status(400).json({ message: "バックアップファイルを指定してください" });
      }

      const result = await this.restoreService.restore(uploadedPath);
      return res.status(200).json(result);
    } catch (error) {
      console.error("❌ Restore failed:", error);
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

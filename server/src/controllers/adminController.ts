import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { Response } from "express";
import { AdminService } from "../services/adminService.js";
import { ServerSettingsService } from "../services/serverSettingsService.js";

export class AdminController {
  constructor(
    private adminService: AdminService,
    private serverSettingsService: ServerSettingsService,
  ) {}

  getUserList = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const isAdmin = await this.adminService.isAdmin(req.user.userId);
      if (!isAdmin)
        return res.status(403).json({ message: "権限がありません" });
      const users = await this.adminService.getUserList();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  toggleUserActive = async (req: AuthRequest, res: Response) => {
    const userId = String(req.params.userId);
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const isAdmin = await this.adminService.isAdmin(req.user.userId);
      if (!isAdmin)
        return res.status(403).json({ message: "権限がありません" });
      const result = await this.adminService.toggleUserActive(userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  getServerSettings = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const isAdmin = await this.adminService.isAdmin(req.user.userId);
      if (!isAdmin)
        return res.status(403).json({ message: "権限がありません" });

      const settings = await this.serverSettingsService.getAll();
      return res.status(200).json(settings);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  updateServerSetting = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const isAdmin = await this.adminService.isAdmin(req.user.userId);
      if (!isAdmin)
        return res.status(403).json({ message: "権限がありません" });

      const { key, value } = req.body as { key?: unknown; value?: unknown };
      if (typeof key !== "string" || typeof value !== "string") {
        return res.status(400).json({
          message: "keyとvalueには文字列を指定してください",
        });
      }

      const setting = await this.serverSettingsService.set(key, value);
      return res.status(200).json(setting);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };
}

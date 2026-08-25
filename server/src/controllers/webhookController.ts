import type { Response } from "express";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { AdminService } from "../services/adminService.js";
import { WebhookService } from "../services/webhookService.js";
import type { CreateWebhookInput } from "../webhooks/types.js";

export class WebhookController {
  constructor(
    private adminService: AdminService,
    private webhookService: WebhookService,
  ) {}

  private ensureAdmin = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      res.status(401).json({ message: "未ログインです" });
      return false;
    }

    const isAdmin = await this.adminService.isAdmin(req.user.userId);
    if (!isAdmin) {
      res.status(403).json({ message: "権限がありません" });
      return false;
    }

    return true;
  };

  getAll = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      const webhooks = await this.webhookService.getAll();
      return res.status(200).json(webhooks);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      const webhook = await this.webhookService.getById(String(req.params.id));
      if (!webhook) {
        return res.status(404).json({ message: "Webhookが見つかりません" });
      }

      return res.status(200).json(webhook);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      const input = req.body as CreateWebhookInput;
      const webhook = await this.webhookService.create(input);
      return res.status(201).json(webhook);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "エラーが発生しました";
      return res.status(400).json({ message });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      await this.webhookService.delete(String(req.params.id));
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };
}

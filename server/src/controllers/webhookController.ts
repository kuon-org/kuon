import type { Response } from "express";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { AdminService } from "../services/adminService.js";
import { WebhookService } from "../services/webhookService.js";
import { WebhookPreviewService } from "../services/webhookPreviewService.js";
import { webhookEventDefinitions } from "../webhooks/events.js";
import { webhookVariablesByEvent } from "../webhooks/variables.js";
import { webhookPresets } from "../webhooks/presets.js";
import type {
  CreateWebhookInput,
  UpdateWebhookInput,
} from "../webhooks/types.js";

export class WebhookController {
  constructor(
    private adminService: AdminService,
    private webhookService: WebhookService,
    private previewService: WebhookPreviewService,
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

  getMetadata = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      return res.status(200).json({
        events: webhookEventDefinitions.map((event) => ({
          ...event,
          variables: webhookVariablesByEvent[event.type] ?? [],
        })),
        presets: webhookPresets,
      });
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  preview = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      const payload = this.previewService.preview({
        payloadTemplate: req.body?.payloadTemplate,
      });
      return res.status(200).json({ payload });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Previewに失敗しました",
      });
    }
  };

  testSend = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      const result = await this.previewService.testSend({
        url: req.body?.url,
        headers: req.body?.headers,
        payloadTemplate: req.body?.payloadTemplate,
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Test Sendに失敗しました",
      });
    }
  };

  getAll = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;
      return res.status(200).json(await this.webhookService.getAll());
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

      const webhook = await this.webhookService.create(
        req.body as CreateWebhookInput,
      );
      return res.status(201).json(webhook);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      const webhook = await this.webhookService.update(
        String(req.params.id),
        req.body as UpdateWebhookInput,
      );
      return res.status(200).json(webhook);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Webhook更新に失敗しました",
      });
    }
  };

  setActive = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      if (typeof req.body?.isActive !== "boolean") {
        return res.status(400).json({ message: "isActiveを指定してください" });
      }

      const webhook = await this.webhookService.setActive(
        String(req.params.id),
        req.body.isActive,
      );
      return res.status(200).json(webhook);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "状態変更に失敗しました",
      });
    }
  };

  getDeliveries = async (req: AuthRequest, res: Response) => {
    try {
      if (!(await this.ensureAdmin(req, res))) return;

      const parsedLimit = Number(req.query.limit ?? 50);
      const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;
      const deliveries = await this.webhookService.getDeliveries(
        String(req.params.id),
        limit,
      );
      return res.status(200).json(deliveries);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Delivery Logs取得に失敗しました",
      });
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

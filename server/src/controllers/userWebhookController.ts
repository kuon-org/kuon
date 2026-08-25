import type { Response } from "express";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { UserWebhookService } from "../services/userWebhookService.js";
import { WebhookPreviewService } from "../services/webhookPreviewService.js";
import { webhookEventDefinitions } from "../webhooks/events.js";
import { webhookVariablesByEvent } from "../webhooks/variables.js";
import { webhookPresets } from "../webhooks/presets.js";
import type { CreateWebhookInput, UpdateWebhookInput, WebhookDetail } from "../webhooks/types.js";

const hideSecretHeaders = (webhook: WebhookDetail): WebhookDetail => ({
  ...webhook,
  headers: webhook.headers.map((header) =>
    header.isSecret ? { ...header, value: "" } : header,
  ),
});

export class UserWebhookController {
  constructor(
    private service: UserWebhookService,
    private previewService: WebhookPreviewService,
  ) {}

  private userId(req: AuthRequest): string {
    if (!isAuthenticated(req)) throw new Error("未ログインです");
    return req.user.userId;
  }

  getMetadata = async (req: AuthRequest, res: Response) => {
    try {
      this.service.ensureAvailable();
      const events = webhookEventDefinitions
        .filter((event) => event.scopes.includes("user"))
        .map((event) => ({
          ...event,
          variables: webhookVariablesByEvent[event.type] ?? [],
        }));
      return res.status(200).json({ events, presets: webhookPresets });
    } catch (error) {
      return res.status(403).json({ message: error instanceof Error ? error.message : "利用できません" });
    }
  };

  getAll = async (req: AuthRequest, res: Response) => {
    try {
      const rows = await this.service.getAll(this.userId(req));
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ message: error instanceof Error ? error.message : "取得に失敗しました" });
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await this.service.getById(String(req.params.id), this.userId(req));
      if (!webhook) return res.status(404).json({ message: "Webhookが見つかりません" });
      return res.status(200).json(hideSecretHeaders(webhook));
    } catch (error) {
      return res.status(500).json({ message: error instanceof Error ? error.message : "取得に失敗しました" });
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await this.service.create(
        this.userId(req),
        req.body as Omit<CreateWebhookInput, "scope" | "ownerUserId">,
      );
      return res.status(201).json(hideSecretHeaders(webhook));
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "作成に失敗しました" });
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await this.service.update(
        String(req.params.id),
        this.userId(req),
        req.body as Omit<UpdateWebhookInput, "scope" | "ownerUserId">,
      );
      if (!webhook) return res.status(404).json({ message: "Webhookが見つかりません" });
      return res.status(200).json(hideSecretHeaders(webhook));
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "更新に失敗しました" });
    }
  };

  setActive = async (req: AuthRequest, res: Response) => {
    try {
      if (typeof req.body?.isActive !== "boolean") {
        return res.status(400).json({ message: "isActiveを指定してください" });
      }
      const webhook = await this.service.setActive(
        String(req.params.id),
        this.userId(req),
        req.body.isActive,
      );
      if (!webhook) return res.status(404).json({ message: "Webhookが見つかりません" });
      return res.status(200).json(webhook);
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "状態変更に失敗しました" });
    }
  };

  getDeliveries = async (req: AuthRequest, res: Response) => {
    try {
      const parsed = Number(req.query.limit ?? 50);
      const logs = await this.service.getDeliveries(
        String(req.params.id),
        this.userId(req),
        Number.isFinite(parsed) ? parsed : 50,
      );
      if (!logs) return res.status(404).json({ message: "Webhookが見つかりません" });
      return res.status(200).json(logs);
    } catch (error) {
      return res.status(500).json({ message: error instanceof Error ? error.message : "Delivery Logs取得に失敗しました" });
    }
  };

  preview = async (req: AuthRequest, res: Response) => {
    try {
      this.service.ensureAvailable();
      this.userId(req);
      const payload = this.previewService.preview({
        eventType: req.body?.eventType,
        payloadTemplate: req.body?.payloadTemplate,
      });
      return res.status(200).json({ payload });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Previewに失敗しました" });
    }
  };

  testSend = async (req: AuthRequest, res: Response) => {
    try {
      this.service.ensureAvailable();
      this.userId(req);
      const result = await this.previewService.testSend({
        eventType: req.body?.eventType,
        url: req.body?.url,
        headers: req.body?.headers,
        payloadTemplate: req.body?.payloadTemplate,
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Test Sendに失敗しました" });
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await this.service.delete(String(req.params.id), this.userId(req));
      if (!deleted) return res.status(404).json({ message: "Webhookが見つかりません" });
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "削除に失敗しました" });
    }
  };
}

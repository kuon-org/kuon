import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
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
    private webhookService: WebhookService,
    private previewService: WebhookPreviewService,
  ) {}

  getMetadata = async (_req: AuthRequest, res: Response) => {
    try {
      const events = webhookEventDefinitions
        .filter((event) => event.scopes.includes("system"))
        .map((event) => ({
          ...event,
          variables: webhookVariablesByEvent[event.type] ?? [],
        }));
      const allowedEvents = new Set(events.map((event) => event.type));

      return res.status(200).json({
        events,
        presets: webhookPresets.filter((preset) => allowedEvents.has(preset.event)),
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
      const payload = this.previewService.preview({
        payloadTemplate: req.body?.payloadTemplate,
        eventType: req.body?.eventType,
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
      const result = await this.previewService.testSend({
        url: req.body?.url,
        headers: req.body?.headers,
        payloadTemplate: req.body?.payloadTemplate,
        eventType: req.body?.eventType,
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Test Sendに失敗しました",
      });
    }
  };

  getAll = async (_req: AuthRequest, res: Response) => {
    try {
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

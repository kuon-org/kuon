import type { Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
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

  private internal(code: string, message: string, error: unknown) {
    console.error(message, error);
    return new AppError(500, code, message);
  }

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
      throw this.internal("WEBHOOK_METADATA_FETCH_FAILED", "Failed to fetch webhook metadata", error);
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
      console.error("Webhook preview failed", error);
      throw new AppError(400, "WEBHOOK_PREVIEW_FAILED", "Webhook preview failed");
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
      console.error("Webhook test send failed", error);
      throw new AppError(400, "WEBHOOK_TEST_SEND_FAILED", "Webhook test send failed");
    }
  };

  getAll = async (_req: AuthRequest, res: Response) => {
    try {
      return res.status(200).json(await this.webhookService.getAll());
    } catch (error) {
      throw this.internal("WEBHOOK_LIST_FETCH_FAILED", "Failed to fetch webhooks", error);
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await this.webhookService.getById(String(req.params.id));
      if (!webhook) {
        throw new AppError(404, "WEBHOOK_NOT_FOUND", "Webhook not found");
      }
      return res.status(200).json(webhook);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw this.internal("WEBHOOK_FETCH_FAILED", "Failed to fetch webhook", error);
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await this.webhookService.create(
        req.body as CreateWebhookInput,
      );
      return res.status(201).json(webhook);
    } catch (error) {
      console.error("Webhook creation failed", error);
      throw new AppError(400, "WEBHOOK_CREATE_FAILED", "Failed to create webhook");
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
      console.error("Webhook update failed", error);
      throw new AppError(400, "WEBHOOK_UPDATE_FAILED", "Failed to update webhook");
    }
  };

  setActive = async (req: AuthRequest, res: Response) => {
    if (typeof req.body?.isActive !== "boolean") {
      throw new ValidationError({ isActive: ["BOOLEAN_REQUIRED"] });
    }

    try {
      const webhook = await this.webhookService.setActive(
        String(req.params.id),
        req.body.isActive,
      );
      return res.status(200).json(webhook);
    } catch (error) {
      console.error("Webhook status update failed", error);
      throw new AppError(400, "WEBHOOK_STATUS_UPDATE_FAILED", "Failed to update webhook status");
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
      throw this.internal("WEBHOOK_DELIVERIES_FETCH_FAILED", "Failed to fetch webhook deliveries", error);
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      await this.webhookService.delete(String(req.params.id));
      return res.status(204).send();
    } catch (error) {
      throw this.internal("WEBHOOK_DELETE_FAILED", "Failed to delete webhook", error);
    }
  };
}

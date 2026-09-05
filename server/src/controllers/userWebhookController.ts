import type { Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
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
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    return req.user.userId;
  }

  getMetadata = async (_req: AuthRequest, res: Response) => {
    try {
      this.service.ensureAvailable();
      const events = webhookEventDefinitions
        .filter((event) => event.scopes.includes("user"))
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
      console.error("User webhook metadata unavailable", error);
      throw new AppError(403, "USER_WEBHOOK_UNAVAILABLE", "User webhooks are unavailable");
    }
  };

  getAll = async (req: AuthRequest, res: Response) => {
    try {
      return res.status(200).json(await this.service.getAll(this.userId(req)));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("User webhook list fetch failed", error);
      throw new AppError(500, "USER_WEBHOOK_LIST_FETCH_FAILED", "Failed to fetch user webhooks");
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await this.service.getById(String(req.params.id), this.userId(req));
      if (!webhook) throw new AppError(404, "WEBHOOK_NOT_FOUND", "Webhook not found");
      return res.status(200).json(hideSecretHeaders(webhook));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("User webhook fetch failed", error);
      throw new AppError(500, "USER_WEBHOOK_FETCH_FAILED", "Failed to fetch user webhook");
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
      if (error instanceof AppError) throw error;
      console.error("User webhook creation failed", error);
      throw new AppError(400, "USER_WEBHOOK_CREATE_FAILED", "Failed to create user webhook");
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await this.service.update(
        String(req.params.id),
        this.userId(req),
        req.body as Omit<UpdateWebhookInput, "scope" | "ownerUserId">,
      );
      if (!webhook) throw new AppError(404, "WEBHOOK_NOT_FOUND", "Webhook not found");
      return res.status(200).json(hideSecretHeaders(webhook));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("User webhook update failed", error);
      throw new AppError(400, "USER_WEBHOOK_UPDATE_FAILED", "Failed to update user webhook");
    }
  };

  setActive = async (req: AuthRequest, res: Response) => {
    if (typeof req.body?.isActive !== "boolean") {
      throw new ValidationError({ isActive: ["BOOLEAN_REQUIRED"] });
    }
    try {
      const webhook = await this.service.setActive(
        String(req.params.id),
        this.userId(req),
        req.body.isActive,
      );
      if (!webhook) throw new AppError(404, "WEBHOOK_NOT_FOUND", "Webhook not found");
      return res.status(200).json(webhook);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("User webhook status update failed", error);
      throw new AppError(400, "USER_WEBHOOK_STATUS_UPDATE_FAILED", "Failed to update user webhook status");
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
      if (!logs) throw new AppError(404, "WEBHOOK_NOT_FOUND", "Webhook not found");
      return res.status(200).json(logs);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("User webhook deliveries fetch failed", error);
      throw new AppError(500, "USER_WEBHOOK_DELIVERIES_FETCH_FAILED", "Failed to fetch user webhook deliveries");
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
      if (error instanceof AppError) throw error;
      console.error("User webhook preview failed", error);
      throw new AppError(400, "USER_WEBHOOK_PREVIEW_FAILED", "User webhook preview failed");
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
      if (error instanceof AppError) throw error;
      console.error("User webhook test send failed", error);
      throw new AppError(400, "USER_WEBHOOK_TEST_SEND_FAILED", "User webhook test send failed");
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await this.service.delete(String(req.params.id), this.userId(req));
      if (!deleted) throw new AppError(404, "WEBHOOK_NOT_FOUND", "Webhook not found");
      return res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("User webhook deletion failed", error);
      throw new AppError(400, "USER_WEBHOOK_DELETE_FAILED", "Failed to delete user webhook");
    }
  };
}

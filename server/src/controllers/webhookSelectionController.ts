import type { Response } from "express";
import { AppError } from "../errors/AppError.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { webhookSelectionService } from "../services/webhookSelectionService.js";

export class WebhookSelectionController {
  getArticlePublishedTargets = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    try {
      const targets = await webhookSelectionService.getArticlePublishedTargets(
        req.user.userId,
      );
      return res.status(200).json(targets);
    } catch (error) {
      console.error("Webhook target list fetch failed", error);
      throw new AppError(
        500,
        "WEBHOOK_TARGET_LIST_FETCH_FAILED",
        "Failed to fetch webhook targets",
      );
    }
  };
}

export const webhookSelectionController = new WebhookSelectionController();

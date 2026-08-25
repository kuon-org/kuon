import type { Response } from "express";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { webhookSelectionService } from "../services/webhookSelectionService.js";

export class WebhookSelectionController {
  getArticlePublishedTargets = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    try {
      const targets = await webhookSelectionService.getArticlePublishedTargets(
        req.user.userId,
      );
      return res.status(200).json(targets);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Webhook一覧の取得に失敗しました",
      });
    }
  };
}

export const webhookSelectionController = new WebhookSelectionController();

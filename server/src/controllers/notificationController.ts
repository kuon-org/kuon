import type { Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
import {
  type AuthRequest,
  isAuthenticated,
} from "../middlewares/auth.js";
import { notificationService } from "../services/notificationService.js";
import { notificationStreamService } from "../services/notificationStreamService.js";

export class NotificationController {
  private requireUser(req: AuthRequest) {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    return req.user;
  }

  list = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const limit = Number(req.query.limit ?? 20);
    res.json(await notificationService.list(user.userId, limit));
  };

  unreadCount = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    res.json(await notificationService.unreadCount(user.userId));
  };

  getPreferences = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    res.json(await notificationService.getPreferences(user.userId));
  };

  updatePreferences = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const {
      notifyOnArticleComment,
      notifyOnCommentReply,
      notifyOnFollowedTagArticle,
      notifyOnFollowedUserArticle,
      notifyOnUserFollow,
    } = req.body;
    const fields: Record<string, string[]> = {};
    const values = {
      notifyOnArticleComment,
      notifyOnCommentReply,
      notifyOnFollowedTagArticle,
      notifyOnFollowedUserArticle,
      notifyOnUserFollow,
    };
    for (const [key, value] of Object.entries(values)) {
      if (typeof value !== "boolean") fields[key] = ["BOOLEAN_REQUIRED"];
    }
    if (Object.keys(fields).length > 0) throw new ValidationError(fields);

    res.json(
      await notificationService.updatePreferences(user.userId, values),
    );
  };

  markRead = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const notificationId = String(req.params.notificationId);
    await notificationService.markRead(user.userId, notificationId);
    res.status(204).send();
  };

  markAllRead = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    await notificationService.markAllRead(user.userId);
    res.status(204).send();
  };

  deleteOne = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const notificationId = String(req.params.notificationId);
    await notificationService.deleteOne(user.userId, notificationId);
    res.status(204).send();
  };

  deleteAll = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    await notificationService.deleteAll(user.userId);
    res.status(204).send();
  };

  stream = (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    if (!notificationService.isEnabled()) {
      throw new AppError(
        503,
        "NOTIFICATIONS_DISABLED",
        "In-app notifications are disabled",
      );
    }

    const userId = user.userId;
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write("event: connected\ndata: {}\n\n");

    notificationStreamService.add(userId, res);
    const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 25_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      notificationStreamService.remove(userId, res);
      res.end();
    });
  };
}

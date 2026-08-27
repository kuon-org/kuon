import type { Response } from "express";
import {
  type AuthRequest,
  isAuthenticated,
} from "../middlewares/auth.js";
import { notificationService } from "../services/notificationService.js";
import { notificationStreamService } from "../services/notificationStreamService.js";

export class NotificationController {
  list = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) return res.status(401).json({ message: "認証が必要です" });
    const limit = Number(req.query.limit ?? 20);
    res.json(await notificationService.list(req.user.userId, limit));
  };

  unreadCount = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) return res.status(401).json({ message: "認証が必要です" });
    res.json(await notificationService.unreadCount(req.user.userId));
  };

  markRead = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) return res.status(401).json({ message: "認証が必要です" });
    await notificationService.markRead(req.user.userId, req.params.notificationId);
    res.status(204).send();
  };

  markAllRead = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) return res.status(401).json({ message: "認証が必要です" });
    await notificationService.markAllRead(req.user.userId);
    res.status(204).send();
  };

  stream = (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) return res.status(401).json({ message: "認証が必要です" });

    const userId = req.user.userId;
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

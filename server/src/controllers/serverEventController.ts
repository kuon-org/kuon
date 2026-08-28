import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import { serverEventService } from "../services/serverEventService.js";
import type { ServerEventCategory, ServerEventLevel } from "../repositories/serverEventRepository.js";

const toDate = (value: unknown) => {
  if (typeof value !== "string" || value.length === 0) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export class ServerEventController {
  list = async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    const level = typeof req.query.level === "string" ? req.query.level : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const eventType = typeof req.query.eventType === "string" ? req.query.eventType : undefined;

    if (level && !["info", "warning", "error"].includes(level)) {
      return res.status(400).json({ message: "不正なlevelです" });
    }
    if (category && !["system", "audit"].includes(category)) {
      return res.status(400).json({ message: "不正なcategoryです" });
    }

    res.json(
      await serverEventService.list({
        page: Number.isFinite(page) ? page : 1,
        limit: Number.isFinite(limit) ? limit : 50,
        level: level as ServerEventLevel | undefined,
        category: category as ServerEventCategory | undefined,
        eventType,
        from: toDate(req.query.from),
        to: toDate(req.query.to),
      }),
    );
  };

  detail = async (req: AuthRequest, res: Response) => {
    try {
      res.json(await serverEventService.detail(String(req.params.eventId)));
    } catch (error) {
      if (error instanceof Error && error.message === "ServerEventNotFound") {
        return res.status(404).json({ message: "イベントログが見つかりません" });
      }
      throw error;
    }
  };
}

export const serverEventController = new ServerEventController();

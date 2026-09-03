import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { mailService } from "../services/mailService.js";
import {
  smtpSettingsService,
  type UpdateSmtpSettingsInput,
} from "../services/smtpSettingsService.js";

export class MailController {
  getSettings = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    try {
      return res.status(200).json(await smtpSettingsService.getPublic());
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "SMTP設定の取得に失敗しました",
      });
    }
  };

  updateSettings = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    try {
      const body = req.body as Partial<UpdateSmtpSettingsInput>;
      if (
        typeof body.host !== "string" ||
        typeof body.port !== "number" ||
        typeof body.secure !== "boolean" ||
        typeof body.username !== "string" ||
        typeof body.fromAddress !== "string" ||
        typeof body.fromName !== "string" ||
        (body.password !== undefined && typeof body.password !== "string")
      ) {
        return res.status(400).json({ message: "SMTP設定の形式が不正です" });
      }

      const settings = await smtpSettingsService.update({
        host: body.host,
        port: body.port,
        secure: body.secure,
        username: body.username,
        password: body.password,
        fromAddress: body.fromAddress,
        fromName: body.fromName,
      });
      return res.status(200).json(settings);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "SMTP設定の更新に失敗しました",
      });
    }
  };

  sendTest = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    const { to } = req.body as { to?: unknown };
    if (typeof to !== "string" || !to.trim()) {
      return res.status(400).json({ message: "送信先メールアドレスを指定してください" });
    }

    try {
      await mailService.sendTest(to.trim());
      return res.status(200).json({ message: "テストメールを送信しました" });
    } catch (error) {
      return res.status(502).json({
        message:
          error instanceof Error ? error.message : "テストメールの送信に失敗しました",
      });
    }
  };
}

export const mailController = new MailController();

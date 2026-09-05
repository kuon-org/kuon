import type { Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { mailService } from "../services/mailService.js";
import {
  smtpSettingsService,
  type UpdateSmtpSettingsInput,
} from "../services/smtpSettingsService.js";

export class MailController {
  private requireUser(req: AuthRequest) {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    return req.user;
  }

  getSettings = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    try {
      return res.status(200).json(await smtpSettingsService.getPublic());
    } catch (error) {
      console.error("SMTP settings fetch failed", error);
      throw new AppError(500, "SMTP_SETTINGS_FETCH_FAILED", "Failed to fetch SMTP settings");
    }
  };

  updateSettings = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    const body = req.body as Partial<UpdateSmtpSettingsInput>;
    const fields: Record<string, string[]> = {};
    if (typeof body.host !== "string") fields.host = ["STRING_REQUIRED"];
    if (typeof body.port !== "number") fields.port = ["NUMBER_REQUIRED"];
    if (typeof body.secure !== "boolean") fields.secure = ["BOOLEAN_REQUIRED"];
    if (typeof body.username !== "string") fields.username = ["STRING_REQUIRED"];
    if (typeof body.fromAddress !== "string") fields.fromAddress = ["STRING_REQUIRED"];
    if (typeof body.fromName !== "string") fields.fromName = ["STRING_REQUIRED"];
    if (body.password !== undefined && typeof body.password !== "string") {
      fields.password = ["STRING_REQUIRED"];
    }
    if (Object.keys(fields).length > 0) throw new ValidationError(fields);

    try {
      const settings = await smtpSettingsService.update({
        host: body.host!,
        port: body.port!,
        secure: body.secure!,
        username: body.username!,
        password: body.password,
        fromAddress: body.fromAddress!,
        fromName: body.fromName!,
      });
      return res.status(200).json(settings);
    } catch (error) {
      console.error("SMTP settings update failed", error);
      throw new AppError(400, "SMTP_SETTINGS_UPDATE_FAILED", "Failed to update SMTP settings");
    }
  };

  sendTest = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    const { to } = req.body as { to?: unknown };
    if (typeof to !== "string" || !to.trim()) {
      throw new ValidationError({ to: ["EMAIL_REQUIRED"] });
    }

    try {
      await mailService.sendTest(to.trim());
      return res.status(200).json({ message: "テストメールを送信しました" });
    } catch (error) {
      console.error("SMTP test mail failed", error);
      throw new AppError(502, "SMTP_TEST_SEND_FAILED", "Failed to send test email");
    }
  };
}

export const mailController = new MailController();

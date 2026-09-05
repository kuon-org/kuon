import { Response } from "express";
import qrcode from "qrcode";
import { AppError, ValidationError } from "../errors/AppError.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { TotpService } from "../services/totpService.js";

export class TotpController {
  constructor(private service: TotpService) {}

  setup = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    try {
      const { otpauthUrl } = await this.service.setup(req.user.userId);
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
      return res.json({ qrCodeUrl: qrCodeDataUrl });
    } catch (error) {
      console.error("TOTP setup failed", error);
      throw new AppError(500, "TOTP_SETUP_FAILED", "TOTP setup failed");
    }
  };

  verifySetup = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    const { token } = req.body;
    if (typeof token !== "string" || !/^\d{6}$/.test(token)) {
      throw new ValidationError({ token: ["TWO_FACTOR_CODE_INVALID_FORMAT"] });
    }

    try {
      await this.service.confirmSetup(req.user.userId, token);
      return res.json({ success: true, message: "二段階認証を有効化しました" });
    } catch {
      throw new AppError(400, "INVALID_2FA_CODE", "Invalid two-factor authentication code");
    }
  };

  disable = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    try {
      await this.service.disable(req.user.userId);
      return res.status(200).json({ message: "success" });
    } catch (error) {
      console.error("TOTP disable failed", error);
      throw new AppError(500, "TOTP_DISABLE_FAILED", "TOTP disable failed");
    }
  };
}

// src/controllers/authController.ts
import { Request, Response } from "express";
import { AuthService, type ExternalAuthResult } from "../services/authService.js";
import { AuthRequest } from "../middlewares/auth.js";
import {
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
  getCookieOptions,
} from "../utils/sessionTokens/index.js";
import {
  createPending2FAToken,
  PENDING_2FA_MAX_AGE_MS,
} from "../utils/pending2faToken/index.js";
import { getDeviceNameFromUserAgent } from "../utils/uaParser/index.js";

const BASE_URL = process.env.APP_SITE_URL ?? process.env.FRONTEND_URL;
const frontendUrl = (path = "/") =>
  new URL(path, `${(BASE_URL || "http://localhost:5050").replace(/\/$/, "")}/`)
    .toString();

export class AuthController {
  constructor(private service: AuthService) {}

  login = async (req: AuthRequest, res: Response) => {
    try {
      const { url } = await this.service.generateAuthUrl(
        String(req.params.provider),
        req.user?.userId,
      );
      res.redirect(url);
    } catch (err) {
      console.error("Auth URL generation failed:", err);
      res.status(500).json({ error: "Auth URL generation failed" });
    }
  };

  callback = async (req: AuthRequest, res: Response) => {
    try {
      const providerName = String(req.params.provider);
      const userAgent = req.get("User-Agent") ?? undefined;
      const metadata = {
        ipAddress: req.ip,
        userAgent,
        deviceName: getDeviceNameFromUserAgent(userAgent),
      };
      let result: ExternalAuthResult;

      if (req.method === "POST") {
        result = await this.service.handleSamlCallback(
          providerName,
          req.body,
          req.user?.userId,
          metadata,
        );
      } else {
        const { code, state } = req.query;
        result = await this.service.handleCallback(
          providerName,
          code as string,
          state as string,
          req.user?.userId,
          metadata,
        );
      }

      if (result.requires2FA) {
        res.cookie(
          "pending_2fa_token",
          createPending2FAToken(result.userId),
          getCookieOptions(PENDING_2FA_MAX_AGE_MS),
        );
        return res.redirect(frontendUrl("/login/2fa"));
      }

      res.cookie(
        "access_token",
        result.accessToken,
        getCookieOptions(ACCESS_TOKEN_MAX_AGE_MS),
      );
      res.cookie(
        "refresh_token",
        result.refreshToken,
        getCookieOptions(REFRESH_TOKEN_MAX_AGE_MS),
      );
      res.clearCookie("pending_2fa_token", getCookieOptions(0));
      return res.redirect(frontendUrl());
    } catch (err: any) {
      console.error("Auth Callback Error:", err.message);
      return res
        .status(500)
        .json({ error: "Authentication failed", details: err.message });
    }
  };

  selectAvatar = async (req: AuthRequest, res: Response) => {
    try {
      const { avatarId } = req.body;
      if (!req.user?.userId) return res.status(401).send();
      await this.service.switchAvatar(req.user.userId, avatarId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to switch avatar" });
    }
  };

  unlinkProvider = async (req: AuthRequest, res: Response) => {
    try {
      const provider = String(req.params.provider);
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      await this.service.unlinkService(userId, provider);
      res.json({
        success: true,
        message: `${provider} の連携を解除しました。`,
      });
    } catch (err: any) {
      res.status(500).json({ error: "連携解除に失敗しました。" });
    }
  };
}

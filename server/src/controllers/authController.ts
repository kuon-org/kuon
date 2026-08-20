// src/controllers/authController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/authService.js";
import { AuthRequest } from "../middlewares/auth.js";
import {
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
  getCookieOptions,
} from "../utils/sessionTokens/index.js";
import { getDeviceNameFromUserAgent } from "../utils/uaParser/index.js";

const BASE_URL = process.env.APP_SITE_URL ?? process.env.FRONTEND_URL;
export class AuthController {
  constructor(private service: AuthService) {}

  login = async (req: AuthRequest, res: Response) => {
    try {
      // ログイン中であれば userId を渡す（共通エンドポイント対応）
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
      let token: { accessToken: string; refreshToken: string };

      if (req.method === "POST") {
        // SAMLコールバック (POST)
        token = await this.service.handleSamlCallback(
          providerName,
          req.body,
          req.user?.userId,
          metadata,
        );
      } else {
        // 既存の OAuth2/OIDC コールバック (GET)
        const { code, state } = req.query;
        token = await this.service.handleCallback(
          providerName,
          code as string,
          state as string,
          req.user?.userId,
          metadata,
        );
      }
      res.cookie(
        "access_token",
        token.accessToken,
        getCookieOptions(ACCESS_TOKEN_MAX_AGE_MS),
      );
      res.cookie(
        "refresh_token",
        token.refreshToken,
        getCookieOptions(REFRESH_TOKEN_MAX_AGE_MS),
      );
      res.redirect(BASE_URL || "http://localhost:5050");
    } catch (err: any) {
      console.error("Auth Callback Error:", err.message);
      res
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

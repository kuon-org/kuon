import { Request, Response } from "express";
import { UsersService } from "../services/usersService.js";
import {
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
  getCookieOptions,
} from "../utils/sessionTokens/index.js";
import {
  createPending2FAToken,
  PENDING_2FA_MAX_AGE_MS,
  verifyPending2FAToken,
} from "../utils/pending2faToken/index.js";
import { verifyTotpForUser } from "../utils/totp/index.js";
import { getDeviceNameFromUserAgent } from "../utils/uaParser/index.js";

export class LocalAuthController {
  constructor(private usersService: UsersService) {}

  private getSessionMetadata(req: Request) {
    const userAgent = req.get("User-Agent") ?? undefined;
    return {
      ipAddress:
        (req.headers["cf-connecting-ip"] as string) ||
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip,
      userAgent,
      deviceName: getDeviceNameFromUserAgent(userAgent),
    };
  }

  private setSessionCookies(
    res: Response,
    session: { accessToken: string; refreshToken: string },
  ) {
    res.cookie(
      "access_token",
      session.accessToken,
      getCookieOptions(ACCESS_TOKEN_MAX_AGE_MS),
    );
    res.cookie(
      "refresh_token",
      session.refreshToken,
      getCookieOptions(REFRESH_TOKEN_MAX_AGE_MS),
    );
  }

  login = async (req: Request, res: Response) => {
    const { identifier, password } = req.body;

    try {
      const user = await this.usersService.loginUser(identifier, password);
      const requires2FA = await this.usersService.getIs2FAEnabled(user.id);

      if (requires2FA) {
        const pendingToken = createPending2FAToken(user.id);
        res.cookie(
          "pending_2fa_token",
          pendingToken,
          getCookieOptions(PENDING_2FA_MAX_AGE_MS),
        );
        return res.json({
          requires2FA: true,
          message: "二段階認証コードを入力してください",
        });
      }

      await this.usersService.updateLastLogin(user.id);
      const session = await this.usersService.createSessionForUser(
        user.id,
        this.getSessionMetadata(req),
      );
      this.setSessionCookies(res, session);
      res.clearCookie("pending_2fa_token", getCookieOptions(0));

      return res.json({
        message: "ログインに成功しました",
        user: { id: user.id, username: user.username },
      });
    } catch (error: any) {
      if (
        ["InvalidCredentials", "AccountNotFound", "UserNotFound"].includes(
          error.message,
        )
      ) {
        return res.status(401).json({ message: "認証に失敗しました" });
      }
      return res
        .status(500)
        .json({ message: error.message || "エラーが発生しました" });
    }
  };

  verify2FA = async (req: Request, res: Response) => {
    const { token } = req.body;
    const pendingToken = req.cookies.pending_2fa_token;

    if (!pendingToken) {
      return res.status(401).json({
        message: "二段階認証の有効期限が切れています。ログインをやり直してください。",
      });
    }
    if (typeof token !== "string" || !/^\d{6}$/.test(token)) {
      return res.status(400).json({ message: "6桁の認証コードを入力してください" });
    }

    try {
      const { userId } = verifyPending2FAToken(pendingToken);
      await verifyTotpForUser(userId, token);
      const user = await this.usersService.getUserById(userId);

      await this.usersService.updateLastLogin(user.id);
      const session = await this.usersService.createSessionForUser(
        user.id,
        this.getSessionMetadata(req),
      );

      this.setSessionCookies(res, session);
      res.clearCookie("pending_2fa_token", getCookieOptions(0));

      return res.json({
        success: true,
        message: "二段階認証が完了しました",
        user: { id: user.id, username: user.username },
      });
    } catch (error: any) {
      if (error?.name === "TokenExpiredError") {
        res.clearCookie("pending_2fa_token", getCookieOptions(0));
        return res.status(401).json({
          message: "二段階認証の有効期限が切れています。ログインをやり直してください。",
        });
      }
      return res.status(400).json({
        message: error.message || "認証コードの検証に失敗しました",
      });
    }
  };
}

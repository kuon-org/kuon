import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";
import crypto from "crypto";
import { serverSettingsService } from "../services/serverSettingsService.js";
import { ServerSettingKey } from "../constants/serverSettings.js";
import JWT_SECRET from "../utils/sessionTokens/jwtSecret.js";

interface JwtPayload {
  userId: string;
  sid: string;
}

export interface AuthRequest extends Request {
  user?: { userId: string; sessionId: string };
}

export interface AuthenticatedRequest extends Request {
  user: { userId: string; sessionId: string };
}

const clearAuthCookies = (res: Response) => {
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
};

const isJwtPayload = (value: jwt.JwtPayload | string): value is jwt.JwtPayload & JwtPayload => {
  return (
    typeof value !== "string" &&
    typeof value.userId === "string" &&
    value.userId.length > 0 &&
    typeof value.sid === "string" &&
    value.sid.length > 0
  );
};

const verifyAccessToken = (accessToken: string): JwtPayload => {
  const decoded = jwt.verify(accessToken, JWT_SECRET, {
    algorithms: ["HS256"],
  });
  if (!isJwtPayload(decoded)) throw new Error("Invalid access token payload");
  return decoded;
};

const validateRefreshSession = async (refreshToken: string) => {
  if (!refreshToken) return null;
  const session = await prisma.user_sessions.findUnique({ where: { refresh_token: refreshToken } });
  if (!session) return null;
  if (session.expires_at < new Date()) {
    await prisma.user_sessions.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session;
};

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const apiKey = req.header("x-api-key");
  if (apiKey) {
    const key = await validateApiKey(apiKey);
    if (!key) return res.status(401).json({ message: "無効なAPIキーです" });
    req.user = { userId: key.user_id, sessionId: "apikey" };
    return next();
  }

  const accessToken = req.cookies.access_token;
  if (!accessToken) return res.status(401).json({ message: "認証が必要です" });

  try {
    const decoded = verifyAccessToken(accessToken);
    const session = await prisma.user_sessions.findUnique({ where: { id: decoded.sid } });
    if (!session || session.expires_at < new Date() || session.user_id !== decoded.userId) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "セッションが無効です" });
    }
    req.user = { userId: decoded.userId, sessionId: decoded.sid };
    return next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") return res.status(401).json({ message: "アクセストークン期限切れ" });
    clearAuthCookies(res);
    return res.status(401).json({ message: "トークンが無効です" });
  }
};

export function isAuthenticated(req: AuthRequest): req is AuthenticatedRequest {
  return !!req.user;
}

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;
  if (accessToken) {
    try {
      const decoded = verifyAccessToken(accessToken);
      const session = await prisma.user_sessions.findUnique({ where: { id: decoded.sid } });
      if (session && session.expires_at >= new Date() && session.user_id === decoded.userId) {
        req.user = { userId: decoded.userId, sessionId: decoded.sid };
        return next();
      }
      clearAuthCookies(res);
    } catch (err: any) {
      if (err.name !== "TokenExpiredError") clearAuthCookies(res);
    }
  }
  if (refreshToken) {
    const session = await validateRefreshSession(refreshToken);
    if (session) req.user = { userId: session.user_id, sessionId: session.id };
    else clearAuthCookies(res);
  }
  next();
};

/** APIキーの検証 */
const validateApiKey = async (apiKey: string) => {
  if (!serverSettingsService.isEnabled(ServerSettingKey.AllowApiKey)) return null;

  const hash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const key = await prisma.user_api_keys.findUnique({ where: { api_key_hash: hash } });
  if (!key) return null;
  if (!key.is_active || key.revoked_at) return null;
  if (key.expires_at && key.expires_at < new Date()) return null;

  prisma.user_api_keys.update({
    where: { id: key.id },
    data: { last_used_at: new Date() },
  }).catch((err) => console.error("Failed to update last_used_at:", err));

  return key;
};

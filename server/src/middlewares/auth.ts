import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";
import crypto from "crypto";
import { serverSettingsService } from "../services/serverSettingsService.js";
import { ServerSettingKey } from "../constants/serverSettings.js";
import JWT_SECRET from "../utils/sessionTokens/jwtSecret.js";
import { AppError } from "../errors/AppError.js";

interface JwtPayload {
  userId: string;
  sid: string;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: { userId: string; sessionId: string };
  authorization?: {
    resourceScope?: "own" | "any";
  };
}

export interface AuthenticatedRequest extends Request {
  user: { userId: string; sessionId: string };
  authorization?: {
    resourceScope?: "own" | "any";
  };
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
    value.sid.length > 0 &&
    typeof value.exp === "number"
  );
};

const verifyAccessToken = (accessToken: string): JwtPayload => {
  const decoded = jwt.verify(accessToken, JWT_SECRET, {
    algorithms: ["HS256"],
  });
  if (!isJwtPayload(decoded)) throw new Error("Invalid access token payload");
  return decoded;
};

const setSessionExpiryHeaders = (
  res: Response,
  accessTokenExpiresAt: Date,
  refreshTokenExpiresAt: Date,
) => {
  res.setHeader("X-Access-Token-Expires-At", accessTokenExpiresAt.toISOString());
  res.setHeader("X-Refresh-Token-Expires-At", refreshTokenExpiresAt.toISOString());
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
    if (!key) {
      return next(new AppError(401, "INVALID_API_KEY", "Invalid API key"));
    }
    req.user = { userId: key.user_id, sessionId: "apikey" };
    return next();
  }

  const accessToken = req.cookies.access_token;
  if (!accessToken) {
    return next(
      new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required"),
    );
  }

  try {
    const decoded = verifyAccessToken(accessToken);
    const session = await prisma.user_sessions.findUnique({ where: { id: decoded.sid } });
    if (!session || session.expires_at < new Date() || session.user_id !== decoded.userId) {
      clearAuthCookies(res);
      return next(new AppError(401, "SESSION_INVALID", "Session is invalid"));
    }
    req.user = { userId: decoded.userId, sessionId: decoded.sid };
    setSessionExpiryHeaders(
      res,
      new Date(decoded.exp * 1000),
      session.expires_at,
    );
    return next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(
        new AppError(401, "ACCESS_TOKEN_EXPIRED", "Access token has expired"),
      );
    }
    clearAuthCookies(res);
    return next(new AppError(401, "TOKEN_INVALID", "Token is invalid"));
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
        setSessionExpiryHeaders(
          res,
          new Date(decoded.exp * 1000),
          session.expires_at,
        );
        return next();
      }
      clearAuthCookies(res);
    } catch (err: unknown) {
      if (!(err instanceof jwt.TokenExpiredError)) clearAuthCookies(res);
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

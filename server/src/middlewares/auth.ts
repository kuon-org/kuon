import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret";

interface JwtPayload {
  userId: string;
  sid: string;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    sessionId: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    sessionId: string;
  };
}

const clearAuthCookies = (res: Response) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
};

const validateRefreshSession = async (refreshToken: string) => {
  if (!refreshToken) return null;

  const session = await prisma.user_sessions.findUnique({
    where: { refresh_token: refreshToken },
  });

  if (!session) return null;

  if (session.expires_at < new Date()) {
    await prisma.user_sessions
      .delete({ where: { id: session.id } })
      .catch(() => {});
    return null;
  }

  return session;
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.header("x-api-key");

  if (apiKey) {
    const key = await validateApiKey(apiKey);

    if (!key) {
      return res.status(401).json({ message: "無効なAPIキーです" });
    }

    req.user = {
      userId: key.user_id,
      sessionId: "apikey",
    };

    return next();
  }

  const accessToken = req.cookies.access_token;

  // ❌ cookie削除しない
  if (!accessToken) {
    return res.status(401).json({ message: "認証が必要です" });
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as JwtPayload;

    const session = await prisma.user_sessions.findUnique({
      where: { id: decoded.sid },
    });

    // session無効 → cookie削除
    if (!session || session.expires_at < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "セッションが無効です" });
    }

    req.user = {
      userId: decoded.userId,
      sessionId: decoded.sid,
    };

    return next();
  } catch (err: any) {
    // 期限切れ → cookie削除しない
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "アクセストークン期限切れ" });
    }

    // 改ざんなど → cookie削除
    clearAuthCookies(res);
    return res.status(401).json({ message: "トークンが無効です" });
  }
};

export function isAuthenticated(req: AuthRequest): req is AuthenticatedRequest {
  return !!req.user;
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  // access token 優先
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET) as JwtPayload;

      const session = await prisma.user_sessions.findUnique({
        where: { id: decoded.sid },
      });

      if (session && session.expires_at >= new Date()) {
        req.user = {
          userId: decoded.userId,
          sessionId: decoded.sid,
        };
        return next();
      }

      // session無効時のみ削除
      clearAuthCookies(res);
    } catch (err: any) {
      // 期限切れは何もしない
      if (err.name !== "TokenExpiredError") {
        clearAuthCookies(res);
      }
    }
  }

  // fallback refresh token
  if (refreshToken) {
    const session = await validateRefreshSession(refreshToken);

    if (session) {
      req.user = {
        userId: session.user_id,
        sessionId: session.id,
      };
    } else {
      clearAuthCookies(res);
    }
  }

  next();
};

const validateApiKey = async (apiKey: string) => {
  const hash = crypto.createHash("sha256").update(apiKey).digest("hex");

  console.log("call APIKey Authflow:", apiKey);

  const key = await prisma.user_api_keys.findUnique({
    where: { api_key_hash: apiKey },
  });

  if (!key) return null;
  if (!key.is_active) return null;
  if (key.revoked_at) return null;
  if (key.expires_at && key.expires_at < new Date()) return null;

  await prisma.user_api_keys.update({
    where: { id: key.id },
    data: { last_used_at: new Date() },
  });

  return key;
};

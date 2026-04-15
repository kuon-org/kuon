import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret";

interface JwtPayload {
  userId: string;
  sid: string;
}

// ExpressのRequest型を拡張
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
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "認証が必要です" });
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as JwtPayload;

    // session存在チェック（logout反映）
    const session = await prisma.user_sessions.findUnique({
      where: { id: decoded.sid },
    });

    if (!session || session.expires_at < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "セッションが無効です" });
    }

    req.user = {
      userId: decoded.userId,
      sessionId: decoded.sid,
    };

    return next();
  } catch {
    clearAuthCookies(res);
    return res
      .status(401)
      .json({ message: "トークンの有効期限が切れています" });
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

      clearAuthCookies(res);
    } catch (err: any) {
      if (err.name !== "TokenExpiredError") {
        return next();
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

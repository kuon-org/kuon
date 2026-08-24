import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import JWT_SECRET from "./jwtSecret.js";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_EXPIRES_DAYS = 7;
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface AccessTokenPayload {
  userId: string;
  sid: string;
}

export const createAccessToken = (userId: string, sessionId: string) => {
  return jwt.sign(
    {
      userId,
      sid: sessionId,
    } satisfies AccessTokenPayload,
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  );
};

export const createRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const getRefreshTokenExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return expiresAt;
};

export const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge,
  path: "/",
});

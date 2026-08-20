import crypto from "node:crypto";
import jwt from "jsonwebtoken";
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_EXPIRES_DAYS = 7;
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const createAccessToken = (userId, sessionId) => {
    return jwt.sign({
        userId,
        sid: sessionId,
    }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
};
export const createRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};
export const getRefreshTokenExpiryDate = () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
    return expiresAt;
};
export const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
});

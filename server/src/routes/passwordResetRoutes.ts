import argon2 from "argon2";
import { Router, type Request } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
import { authenticateToken, type AuthRequest } from "../middlewares/auth.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { passwordResetService } from "../services/passwordResetService.js";

const router = Router();
const usersRepo = new UsersRepository();
const GENERIC_MESSAGE =
  "入力されたメールアドレスが登録されている場合、再設定用メールを送信しました";
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 5;
const requestsByIp = new Map<string, number[]>();

const getRequestIp = (req: Request) =>
  ((req.headers["cf-connecting-ip"] as string | undefined) ??
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.ip ??
    "unknown");

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) ?? []).filter((value) => now - value < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_IP) {
    requestsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestsByIp.set(ip, recent);
  return false;
};

router.get("/password-reset/status", async (_req, res) => {
  try {
    return res.status(200).json({ available: await passwordResetService.isAvailable() });
  } catch {
    return res.status(200).json({ available: false });
  }
});

router.post("/password-reset/request", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!email) throw new ValidationError({ email: ["EMAIL_REQUIRED"] });

  if (isRateLimited(getRequestIp(req))) {
    throw new AppError(429, "RATE_LIMITED", "Too many password reset requests");
  }

  try {
    await passwordResetService.request(email);
    return res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (error) {
    if (error instanceof Error && error.message === "SmtpNotConfigured") {
      throw new AppError(
        503,
        "PASSWORD_RESET_UNAVAILABLE",
        "Password reset is unavailable",
      );
    }
    return res.status(200).json({ message: GENERIC_MESSAGE });
  }
});

router.post("/password-reset/reset", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  const fields: Record<string, string[]> = {};
  if (!token) fields.token = ["PASSWORD_RESET_TOKEN_REQUIRED"];
  if (newPassword.length < 6) fields.newPassword = ["PASSWORD_TOO_SHORT"];
  if (Object.keys(fields).length > 0) throw new ValidationError(fields);

  try {
    await passwordResetService.reset(token, newPassword);
    return res.status(200).json({ message: "パスワードを再設定しました" });
  } catch (error) {
    if (error instanceof Error && error.message === "PasswordResetTokenExpired") {
      throw new AppError(
        410,
        "PASSWORD_RESET_TOKEN_EXPIRED",
        "Password reset token has expired",
      );
    }
    throw new AppError(
      400,
      "PASSWORD_RESET_TOKEN_INVALID",
      "Password reset token is invalid or already used",
    );
  }
});

router.put("/password/change", authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
  }

  const currentPassword =
    typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword =
    typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  const fields: Record<string, string[]> = {};
  if (!currentPassword) fields.currentPassword = ["CURRENT_PASSWORD_REQUIRED"];
  if (newPassword.length < 6) fields.newPassword = ["PASSWORD_TOO_SHORT"];
  if (Object.keys(fields).length > 0) throw new ValidationError(fields);

  const account = await usersRepo.findLocalAccountByUserId(req.user.userId);
  if (!account?.password_hash) {
    throw new AppError(
      409,
      "LOCAL_PASSWORD_NOT_CONFIGURED",
      "Local password is not configured",
    );
  }

  const valid = await argon2.verify(account.password_hash, currentPassword);
  if (!valid) {
    throw new AppError(
      400,
      "CURRENT_PASSWORD_INVALID",
      "Current password is invalid",
    );
  }

  await usersRepo.updatePassword(req.user.userId, newPassword);
  return res.status(200).json({ message: "パスワードを変更しました" });
});

export default router;

import { Router, type Request } from "express";
import { passwordResetService } from "../services/passwordResetService.js";

const router = Router();
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
  if (!email) return res.status(400).json({ message: "メールアドレスが必要です" });

  if (isRateLimited(getRequestIp(req))) {
    return res.status(429).json({ message: "しばらく時間をおいてから再度お試しください" });
  }

  try {
    await passwordResetService.request(email);
    return res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (error) {
    if (error instanceof Error && error.message === "SmtpNotConfigured") {
      return res.status(503).json({ message: "パスワード再設定機能は利用できません" });
    }
    return res.status(200).json({ message: GENERIC_MESSAGE });
  }
});

router.post("/password-reset/reset", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (!token) return res.status(400).json({ message: "Reset Tokenが必要です" });
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "パスワードは6文字以上必要です" });
  }

  try {
    await passwordResetService.reset(token, newPassword);
    return res.status(200).json({ message: "パスワードを再設定しました" });
  } catch (error) {
    if (error instanceof Error && error.message === "PasswordResetTokenExpired") {
      return res.status(410).json({ message: "再設定URLの有効期限が切れています" });
    }
    return res.status(400).json({ message: "再設定URLが無効または使用済みです" });
  }
});

export default router;

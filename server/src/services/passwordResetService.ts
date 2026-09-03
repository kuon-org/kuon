import crypto from "node:crypto";
import { PasswordResetRepository } from "../repositories/passwordResetRepository.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { eventLogger } from "./eventLogger.js";
import { mailService } from "./mailService.js";
import { serverSettingsService } from "./serverSettingsService.js";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 60 * 1000;

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const resetUrl = (token: string) => {
  const baseUrl = (
    process.env.APP_SITE_URL ??
    process.env.FRONTEND_URL ??
    "http://localhost:5050"
  ).replace(/\/$/, "");
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

export class PasswordResetService {
  constructor(
    private repo = new PasswordResetRepository(),
    private usersRepo = new UsersRepository(),
  ) {}

  async isAvailable(): Promise<boolean> {
    return mailService.isConfigured();
  }

  async request(email: string): Promise<void> {
    if (!(await mailService.isConfigured())) throw new Error("SmtpNotConfigured");

    const account = await this.usersRepo.findLocalAccountByEmail(email);
    if (!account?.user_id || !account.password_hash) {
      await eventLogger.info("password_reset.requested", {
        category: "security",
        source: "auth",
        message: "Password reset requested",
        metadata: {},
      });
      return;
    }

    if (
      serverSettingsService.getEmailVerificationPolicy() === "required" &&
      !account.is_verified
    ) {
      await eventLogger.info("password_reset.requested", {
        category: "security",
        source: "auth",
        message: "Password reset requested",
        metadata: {},
      });
      return;
    }

    const latestCreatedAt = await this.repo.getLatestCreatedAt(account.user_id);
    if (
      latestCreatedAt &&
      Date.now() - latestCreatedAt.getTime() < REQUEST_COOLDOWN_MS
    ) {
      return;
    }

    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.repo.invalidateUnusedByUser(account.user_id);
    await this.repo.create(account.user_id, hashToken(token), expiresAt);

    await mailService.send({
      to: email,
      subject: "Kuon パスワード再設定",
      text: [
        "Kuonのパスワード再設定リクエストを受け付けました。",
        "",
        "以下のURLを開いて新しいパスワードを設定してください。",
        resetUrl(token),
        "",
        "このURLの有効期限は30分です。",
        "心当たりがない場合は、このメールを無視してください。",
      ].join("\n"),
    });

    await eventLogger.info("password_reset.requested", {
      category: "security",
      source: "auth",
      message: "Password reset mail sent",
      metadata: { userId: account.user_id },
    });
  }

  async reset(token: string, newPassword: string): Promise<void> {
    const record = await this.repo.findByHash(hashToken(token));
    if (!record || record.used_at) {
      await eventLogger.warning("password_reset.failed", {
        category: "security",
        source: "auth",
        message: "Password reset failed",
        metadata: {},
      });
      throw new Error("InvalidPasswordResetToken");
    }

    if (record.expires_at.getTime() < Date.now()) {
      await eventLogger.warning("password_reset.expired", {
        category: "security",
        source: "auth",
        message: "Password reset token expired",
        metadata: { userId: record.user_id },
      });
      throw new Error("PasswordResetTokenExpired");
    }

    await this.usersRepo.updatePassword(record.user_id, newPassword);
    await this.usersRepo.deleteAllSessionsByUser(record.user_id);
    await this.repo.markUsed(record.id);
    await this.repo.invalidateUnusedByUser(record.user_id);

    await eventLogger.info("password_reset.completed", {
      category: "security",
      source: "auth",
      message: "Password reset completed",
      metadata: { userId: record.user_id },
    });
  }
}

export const passwordResetService = new PasswordResetService();

import crypto from "node:crypto";
import { EmailVerificationRepository } from "../repositories/emailVerificationRepository.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { eventLogger } from "./eventLogger.js";
import { mailService } from "./mailService.js";
import { serverSettingsService } from "./serverSettingsService.js";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const verificationUrl = (token: string) => {
  const baseUrl = (process.env.APP_SITE_URL ?? process.env.FRONTEND_URL ?? "http://localhost:5050").replace(/\/$/, "");
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
};

export class EmailVerificationService {
  constructor(
    private repo = new EmailVerificationRepository(),
    private usersRepo = new UsersRepository(),
  ) {}

  isRequired(): boolean {
    return serverSettingsService.getEmailVerificationPolicy() === "required";
  }

  async sendForUser(userId: string, email: string, options?: { ignoreCooldown?: boolean }): Promise<void> {
    if (!(await mailService.isConfigured())) throw new Error("SmtpNotConfigured");

    const latestCreatedAt = await this.repo.getLatestCreatedAt(userId);
    if (
      !options?.ignoreCooldown &&
      latestCreatedAt &&
      Date.now() - latestCreatedAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      throw new Error("VerificationResendCooldown");
    }

    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.repo.invalidateUnusedByUser(userId);
    await this.repo.create(userId, tokenHash, expiresAt);

    await mailService.send({
      to: email,
      subject: "Kuon メールアドレス確認",
      text: [
        "Kuonへの登録ありがとうございます。",
        "",
        "以下のURLを開いてメールアドレスの確認を完了してください。",
        verificationUrl(token),
        "",
        "このURLの有効期限は30分です。",
      ].join("\n"),
    });

    await eventLogger.info("email_verification.sent", {
      category: "system",
      source: "mail",
      message: "Email verification mail sent",
      metadata: { userId },
    });
  }

  async verify(token: string): Promise<void> {
    const record = await this.repo.findByHash(hashToken(token));
    if (!record || record.used_at) {
      await eventLogger.warn("email_verification.failed", {
        category: "system",
        source: "mail",
        message: "Email verification failed",
        metadata: {},
      });
      throw new Error("InvalidVerificationToken");
    }

    if (record.expires_at.getTime() < Date.now()) {
      await eventLogger.warn("email_verification.expired", {
        category: "system",
        source: "mail",
        message: "Email verification token expired",
        metadata: { userId: record.user_id },
      });
      throw new Error("VerificationTokenExpired");
    }

    await this.usersRepo.markLocalAccountVerified(record.user_id);
    await this.repo.markUsed(record.id);

    await eventLogger.info("email_verification.completed", {
      category: "system",
      source: "mail",
      message: "Email verification completed",
      metadata: { userId: record.user_id },
    });
  }

  async resend(email: string): Promise<void> {
    const account = await this.usersRepo.findLocalAccountByEmail(email);
    if (!account?.user_id) return;
    if (account.is_verified) return;
    await this.sendForUser(account.user_id, email);
  }
}

export const emailVerificationService = new EmailVerificationService();

import { TOTP } from "@otplib/totp";
import ScureBase32Plugin from "@otplib/plugin-base32-scure";
import NodeCryptoPlugin from "@otplib/plugin-crypto-node";
import { generate2FASecret } from "../utils/2fa/index.js";
import { TotpRepository } from "../repositories/totpRepository.js";

export class TotpService {
  constructor(private repo: TotpRepository) {}

  async isEnabled(userId: string): Promise<boolean> {
    const security = await this.repo.findSecurity(userId);
    return security?.is_2fa_enabled === true;
  }

  async setup(userId: string) {
    const user = await this.repo.findUser(userId);
    if (!user) throw new Error("UserNotFound");

    const label = user.username || user.id;
    const { secret, otpauthUrl } = generate2FASecret(label);
    await this.repo.savePendingSecret(userId, secret);

    return { secret, otpauthUrl };
  }

  async verify(userId: string, token: string): Promise<void> {
    const security = await this.repo.findSecurity(userId);
    if (!security?.totp_secret) throw new Error("2FA設定が見つかりません");

    const totp = new TOTP({
      crypto: new NodeCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
    const result = await totp.verify(token, { secret: security.totp_secret });
    if (!result.valid) throw new Error("認証コードが正しくありません");
  }

  async confirmSetup(userId: string, token: string) {
    await this.verify(userId, token);
    const security = await this.repo.findSecurity(userId);
    if (!security?.totp_secret) throw new Error("2FA設定が見つかりません");
    return this.repo.enable(userId, security.totp_secret);
  }

  async disable(userId: string) {
    return this.repo.disable(userId);
  }
}

export const totpService = new TotpService(new TotpRepository());

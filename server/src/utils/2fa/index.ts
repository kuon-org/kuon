// 2FA関連ユーティリティ
import { TOTP } from "@otplib/totp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

export const generate2FASecret = (accountName: string) => {
  const totp = new TOTP({
    crypto: new NodeCryptoPlugin(),
    base32: new ScureBase32Plugin(),
  });

  const secret = totp.generateSecret();
  const otpauthUrl = totp.toURI({
    secret,
    issuer: "Kuon",
    label: accountName,
  });
  return { secret, otpauthUrl };
};

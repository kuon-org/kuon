import ScureBase32Plugin from "@otplib/plugin-base32-scure";
import NodeCryptoPlugin from "@otplib/plugin-crypto-node";
import { TOTP } from "@otplib/totp";
import prisma from "../../prisma/client.js";

const createTotp = () =>
  new TOTP({
    crypto: new NodeCryptoPlugin(),
    base32: new ScureBase32Plugin(),
  });

export const isTotpEnabledForUser = async (userId: string) => {
  const security = await prisma.user_security.findFirst({
    where: { user_id: userId },
  });
  return security?.is_2fa_enabled === true && !!security.totp_secret;
};

export const verifyTotpForUser = async (userId: string, token: string) => {
  const security = await prisma.user_security.findFirst({
    where: { user_id: userId },
  });

  if (!security?.is_2fa_enabled || !security.totp_secret) {
    throw new Error("2FA設定が見つかりません");
  }

  const result = await createTotp().verify(token, {
    secret: security.totp_secret,
  });

  if (!result.valid) {
    throw new Error("認証コードが正しくありません");
  }
};

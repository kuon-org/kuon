import prisma from "../prisma/client.js";

export class TotpRepository {
  findUser(userId: string) {
    return prisma.users.findUnique({ where: { id: userId } });
  }

  findSecurity(userId: string) {
    return prisma.user_security.findUnique({ where: { user_id: userId } });
  }

  savePendingSecret(userId: string, secret: string) {
    return prisma.user_security.upsert({
      where: { user_id: userId },
      update: { totp_secret: secret, is_2fa_enabled: false },
      create: { user_id: userId, totp_secret: secret, is_2fa_enabled: false },
    });
  }

  enable(userId: string, secret: string) {
    return prisma.user_security.upsert({
      where: { user_id: userId },
      update: { totp_secret: secret, is_2fa_enabled: true },
      create: { user_id: userId, totp_secret: secret, is_2fa_enabled: true },
    });
  }

  disable(userId: string) {
    return prisma.user_security.update({
      where: { user_id: userId },
      data: { totp_secret: null, is_2fa_enabled: false },
    });
  }
}

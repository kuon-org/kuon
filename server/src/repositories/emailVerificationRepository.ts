import prisma from "../prisma/client.js";

export type EmailVerificationTokenRecord = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  used_at: Date | null;
};

export class EmailVerificationRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO knowledge.email_verification_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}::uuid, ${tokenHash}, ${expiresAt})
    `;
  }

  async invalidateUnusedByUser(userId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE knowledge.email_verification_tokens
      SET used_at = NOW()
      WHERE user_id = ${userId}::uuid AND used_at IS NULL
    `;
  }

  async findByHash(tokenHash: string): Promise<EmailVerificationTokenRecord | null> {
    const rows = await prisma.$queryRaw<EmailVerificationTokenRecord[]>`
      SELECT id, user_id, token_hash, expires_at, created_at, used_at
      FROM knowledge.email_verification_tokens
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async markUsed(id: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE knowledge.email_verification_tokens
      SET used_at = NOW()
      WHERE id = ${id}::uuid AND used_at IS NULL
    `;
  }

  async markAccountVerified(userId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE knowledge.local_accounts
      SET is_verified = TRUE, updated_at = NOW()
      WHERE user_id = ${userId}::uuid
    `;
  }

  async markAllExistingAccountsVerified(): Promise<void> {
    await prisma.$executeRaw`
      UPDATE knowledge.local_accounts
      SET is_verified = TRUE, updated_at = NOW()
      WHERE is_verified IS DISTINCT FROM TRUE
    `;
  }

  async getLatestCreatedAt(userId: string): Promise<Date | null> {
    const rows = await prisma.$queryRaw<Array<{ created_at: Date }>>`
      SELECT created_at
      FROM knowledge.email_verification_tokens
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return rows[0]?.created_at ?? null;
  }
}

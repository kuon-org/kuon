import prisma from "../prisma/client.js";

export type NotificationReason = "followed_tag" | "followed_user";

export type NotificationRecord = {
  id: string;
  user_id: string | null;
  type: string | null;
  title: string | null;
  message: string | null;
  reference_id: string | null;
  reference_type: string | null;
  reasons: NotificationReason[];
  is_read: boolean | null;
  created_at: Date | null;
};

export type NotificationPreferences = {
  notifyOnArticleComment: boolean;
  notifyOnCommentReply: boolean;
  notifyOnFollowedTagArticle: boolean;
  notifyOnFollowedUserArticle: boolean;
};

export class NotificationRepository {
  async findByUserId(userId: string, limit = 20): Promise<NotificationRecord[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return prisma.$queryRaw<NotificationRecord[]>`
      SELECT id, user_id, type, title, message, reference_id, reference_type,
             COALESCE(reasons, '[]'::jsonb) AS reasons, is_read, created_at
      FROM knowledge.user_notifications
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;
  }

  async countUnread(userId: string) {
    return prisma.user_notifications.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async create(data: {
    user_id: string;
    type: string;
    title: string;
    message?: string | null;
    reference_id?: string | null;
    reference_type?: string | null;
    reasons?: NotificationReason[];
  }) {
    const rows = await prisma.$queryRaw<NotificationRecord[]>`
      INSERT INTO knowledge.user_notifications
        (user_id, type, title, message, reference_id, reference_type, reasons)
      VALUES
        (${data.user_id}::uuid, ${data.type}, ${data.title}, ${data.message ?? null},
         ${data.reference_id ?? null}::uuid, ${data.reference_type ?? null},
         ${JSON.stringify(data.reasons ?? [])}::jsonb)
      RETURNING id, user_id, type, title, message, reference_id, reference_type,
                reasons, is_read, created_at
    `;
    return rows[0];
  }

  async upsertArticlePublished(data: {
    user_id: string;
    title: string;
    message?: string | null;
    reference_id: string;
    reasons: NotificationReason[];
  }) {
    const existing = await prisma.$queryRaw<NotificationRecord[]>`
      SELECT id, user_id, type, title, message, reference_id, reference_type,
             reasons, is_read, created_at
      FROM knowledge.user_notifications
      WHERE user_id = ${data.user_id}::uuid
        AND type = 'article.published'
        AND reference_type = 'article'
        AND reference_id = ${data.reference_id}::uuid
      LIMIT 1
    `;

    if (existing[0]) {
      const rows = await prisma.$queryRaw<NotificationRecord[]>`
        UPDATE knowledge.user_notifications
        SET reasons = (
          SELECT jsonb_agg(DISTINCT value)
          FROM jsonb_array_elements(
            COALESCE(reasons, '[]'::jsonb) || ${JSON.stringify(data.reasons)}::jsonb
          )
        ),
        title = ${data.title},
        message = ${data.message ?? null}
        WHERE id = ${existing[0].id}::uuid
        RETURNING id, user_id, type, title, message, reference_id, reference_type,
                  reasons, is_read, created_at
      `;
      return rows[0];
    }

    return this.create({
      user_id: data.user_id,
      type: "article.published",
      title: data.title,
      message: data.message,
      reference_id: data.reference_id,
      reference_type: "article",
      reasons: data.reasons,
    });
  }

  async markRead(userId: string, notificationId: string) {
    return prisma.user_notifications.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
  }

  async markAllRead(userId: string) {
    return prisma.user_notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const rows = await prisma.$queryRaw<{
      notify_on_article_comment: boolean | null;
      notify_on_comment_reply: boolean | null;
      notify_on_followed_tag_article: boolean | null;
      notify_on_followed_user_article: boolean | null;
    }[]>`
      SELECT notify_on_article_comment, notify_on_comment_reply,
             notify_on_followed_tag_article, notify_on_followed_user_article
      FROM knowledge.user_settings
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `;
    const row = rows[0];
    return {
      notifyOnArticleComment: row?.notify_on_article_comment ?? true,
      notifyOnCommentReply: row?.notify_on_comment_reply ?? true,
      notifyOnFollowedTagArticle: row?.notify_on_followed_tag_article ?? true,
      notifyOnFollowedUserArticle: row?.notify_on_followed_user_article ?? true,
    };
  }

  async updatePreferences(userId: string, preferences: NotificationPreferences) {
    await prisma.$executeRaw`
      INSERT INTO knowledge.user_settings
        (user_id, notify_on_article_comment, notify_on_comment_reply,
         notify_on_followed_tag_article, notify_on_followed_user_article, updated_at)
      VALUES
        (${userId}::uuid, ${preferences.notifyOnArticleComment}, ${preferences.notifyOnCommentReply},
         ${preferences.notifyOnFollowedTagArticle}, ${preferences.notifyOnFollowedUserArticle}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        notify_on_article_comment = EXCLUDED.notify_on_article_comment,
        notify_on_comment_reply = EXCLUDED.notify_on_comment_reply,
        notify_on_followed_tag_article = EXCLUDED.notify_on_followed_tag_article,
        notify_on_followed_user_article = EXCLUDED.notify_on_followed_user_article,
        updated_at = NOW()
    `;
    return this.getPreferences(userId);
  }
}

export const notificationRepository = new NotificationRepository();

import { Prisma } from "@prisma/client";
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
  notifyOnUserFollow: boolean;
};

const toNotificationRecord = (notification: {
  id: string;
  user_id: string | null;
  type: string | null;
  title: string | null;
  message: string | null;
  reference_id: string | null;
  reference_type: string | null;
  reasons: Prisma.JsonValue;
  is_read: boolean | null;
  created_at: Date | null;
}): NotificationRecord => ({
  ...notification,
  reasons: Array.isArray(notification.reasons)
    ? (notification.reasons.filter(
        (reason): reason is NotificationReason =>
          reason === "followed_tag" || reason === "followed_user",
      ) as NotificationReason[])
    : [],
});

export class NotificationRepository {
  async findByUserId(userId: string, limit = 20): Promise<NotificationRecord[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const notifications = await prisma.user_notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: safeLimit,
    });
    return notifications.map(toNotificationRecord);
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
    const notification = await prisma.user_notifications.create({
      data: {
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message ?? null,
        reference_id: data.reference_id ?? null,
        reference_type: data.reference_type ?? null,
        reasons: data.reasons ?? [],
      },
    });
    return toNotificationRecord(notification);
  }

  async upsertArticlePublished(data: {
    user_id: string;
    title: string;
    message?: string | null;
    reference_id: string;
    reasons: NotificationReason[];
  }) {
    const existing = await prisma.user_notifications.findFirst({
      where: {
        user_id: data.user_id,
        type: "article.published",
        reference_type: "article",
        reference_id: data.reference_id,
      },
    });

    const mergedReasons = Array.from(
      new Set([
        ...(existing ? toNotificationRecord(existing).reasons : []),
        ...data.reasons,
      ]),
    );

    const notification = existing
      ? await prisma.user_notifications.update({
          where: { id: existing.id },
          data: {
            title: data.title,
            message: data.message ?? null,
            reasons: mergedReasons,
          },
        })
      : await prisma.user_notifications.create({
          data: {
            user_id: data.user_id,
            type: "article.published",
            title: data.title,
            message: data.message ?? null,
            reference_id: data.reference_id,
            reference_type: "article",
            reasons: mergedReasons,
          },
        });

    return toNotificationRecord(notification);
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

  async deleteOne(userId: string, notificationId: string) {
    return prisma.user_notifications.deleteMany({
      where: { id: notificationId, user_id: userId },
    });
  }

  async deleteAll(userId: string) {
    return prisma.user_notifications.deleteMany({
      where: { user_id: userId },
    });
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const row = await prisma.user_settings.findUnique({
      where: { user_id: userId },
      select: {
        notify_on_article_comment: true,
        notify_on_comment_reply: true,
        notify_on_followed_tag_article: true,
        notify_on_followed_user_article: true,
        notify_on_user_follow: true,
      },
    });

    return {
      notifyOnArticleComment: row?.notify_on_article_comment ?? true,
      notifyOnCommentReply: row?.notify_on_comment_reply ?? true,
      notifyOnFollowedTagArticle: row?.notify_on_followed_tag_article ?? true,
      notifyOnFollowedUserArticle: row?.notify_on_followed_user_article ?? true,
      notifyOnUserFollow: row?.notify_on_user_follow ?? true,
    };
  }

  async updatePreferences(userId: string, preferences: NotificationPreferences) {
    await prisma.user_settings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        notify_on_article_comment: preferences.notifyOnArticleComment,
        notify_on_comment_reply: preferences.notifyOnCommentReply,
        notify_on_followed_tag_article: preferences.notifyOnFollowedTagArticle,
        notify_on_followed_user_article: preferences.notifyOnFollowedUserArticle,
        notify_on_user_follow: preferences.notifyOnUserFollow,
      },
      update: {
        notify_on_article_comment: preferences.notifyOnArticleComment,
        notify_on_comment_reply: preferences.notifyOnCommentReply,
        notify_on_followed_tag_article: preferences.notifyOnFollowedTagArticle,
        notify_on_followed_user_article: preferences.notifyOnFollowedUserArticle,
        notify_on_user_follow: preferences.notifyOnUserFollow,
        updated_at: new Date(),
      },
    });
    return this.getPreferences(userId);
  }
}

export const notificationRepository = new NotificationRepository();

import prisma from "../prisma/client.js";
import {
  notificationRepository,
  type NotificationPreferences,
  type NotificationReason,
} from "../repositories/notificationRepository.js";
import { ServerSettingKey } from "../constants/serverSettings.js";
import { serverSettingsService } from "./serverSettingsService.js";
import { notificationStreamService } from "./notificationStreamService.js";

export const NotificationType = {
  ArticleCommented: "article.comment.created",
  CommentReplied: "comment.reply.created",
  ArticlePublished: "article.published",
  UserFollowed: "user.followed",
} as const;

class NotificationService {
  isEnabled() {
    return serverSettingsService.isEnabled(ServerSettingKey.NotificationsEnabled);
  }

  async list(userId: string, limit?: number) {
    if (!this.isEnabled()) return [];
    const notifications = await notificationRepository.findByUserId(userId, limit);

    return Promise.all(
      notifications.map(async (notification) => {
        let href: string | null = null;
        let action: { type: "follow_back"; targetUserId: string; isFollowing: boolean } | null = null;

        if (
          notification.reference_id &&
          notification.reference_type === "comment"
        ) {
          const comment = await prisma.comments.findUnique({
            where: { id: notification.reference_id },
            select: {
              id: true,
              article_id: true,
              articles: {
                select: { users: { select: { username: true } } },
              },
            },
          });
          const username = comment?.articles?.users?.username;
          if (comment?.article_id && username) {
            href = `/${encodeURIComponent(username)}/${comment.article_id}#comment-${comment.id}`;
          }
        }

        if (
          notification.reference_id &&
          notification.reference_type === "article"
        ) {
          const article = await prisma.articles.findUnique({
            where: { id: notification.reference_id },
            select: { id: true, users: { select: { username: true } } },
          });
          if (article?.users?.username) {
            href = `/${encodeURIComponent(article.users.username)}/${article.id}`;
          }
        }

        if (
          notification.reference_id &&
          notification.reference_type === "user"
        ) {
          const target = await prisma.users.findUnique({
            where: { id: notification.reference_id },
            select: { id: true, username: true },
          });
          if (target?.username) {
            href = `/${encodeURIComponent(target.username)}`;
          }
          if (notification.type === NotificationType.UserFollowed && target) {
            const following = await prisma.user_follows.findUnique({
              where: {
                follower_id_followee_id: {
                  follower_id: userId,
                  followee_id: target.id,
                },
              },
              select: { follower_id: true },
            });
            action = {
              type: "follow_back",
              targetUserId: target.id,
              isFollowing: !!following,
            };
          }
        }

        return { ...notification, href, action };
      }),
    );
  }

  async unreadCount(userId: string) {
    if (!this.isEnabled()) return { count: 0 };
    return { count: await notificationRepository.countUnread(userId) };
  }

  async getPreferences(userId: string) {
    return notificationRepository.getPreferences(userId);
  }

  async updatePreferences(userId: string, preferences: NotificationPreferences) {
    return notificationRepository.updatePreferences(userId, preferences);
  }

  async markRead(userId: string, notificationId: string) {
    await notificationRepository.markRead(userId, notificationId);
    notificationStreamService.notify(userId);
  }

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
    notificationStreamService.notify(userId);
  }

  async deleteOne(userId: string, notificationId: string) {
    await notificationRepository.deleteOne(userId, notificationId);
    notificationStreamService.notify(userId);
  }

  async deleteAll(userId: string) {
    await notificationRepository.deleteAll(userId);
    notificationStreamService.notify(userId);
  }

  private async create(data: {
    userId: string;
    type: string;
    title: string;
    message?: string | null;
    referenceId?: string | null;
    referenceType?: string | null;
  }) {
    if (!this.isEnabled()) return null;
    const notification = await notificationRepository.create({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      reference_id: data.referenceId,
      reference_type: data.referenceType,
    });
    notificationStreamService.notify(data.userId);
    return notification;
  }

  async userFollowed(followerUserId: string, followeeUserId: string) {
    if (!this.isEnabled() || followerUserId === followeeUserId) return;
    try {
      const preferences = await this.getPreferences(followeeUserId);
      if (!preferences.notifyOnUserFollow) return;

      const follower = await prisma.users.findUnique({
        where: { id: followerUserId },
        select: { display_name: true, username: true },
      });
      const followerName = follower?.display_name ?? follower?.username ?? "ユーザー";

      await this.create({
        userId: followeeUserId,
        type: NotificationType.UserFollowed,
        title: `${followerName}さんにフォローされました`,
        referenceId: followerUserId,
        referenceType: "user",
      });
    } catch (error) {
      console.error("Failed to create user follow notification", error);
    }
  }

  async commentCreated(commentId: string, actorUserId: string) {
    if (!this.isEnabled()) return;
    try {
      const comment = await prisma.comments.findUnique({
        where: { id: commentId },
        include: {
          users: { select: { display_name: true, username: true } },
          articles: { select: { id: true, title: true, user_id: true } },
          comments: { select: { user_id: true } },
        },
      });
      if (!comment?.articles) return;

      const actorName = comment.users?.display_name ?? comment.users?.username ?? "ユーザー";
      const recipients = new Set<string>();

      if (comment.parent_comment_id && comment.comments?.user_id) {
        if (comment.comments.user_id !== actorUserId) {
          const preferences = await this.getPreferences(comment.comments.user_id);
          recipients.add(comment.comments.user_id);
          if (preferences.notifyOnCommentReply) {
            await this.create({
              userId: comment.comments.user_id,
              type: NotificationType.CommentReplied,
              title: `${actorName}さんがコメントに返信しました`,
              message: comment.body,
              referenceId: comment.id,
              referenceType: "comment",
            });
          }
        }
      }

      const articleOwnerId = comment.articles.user_id;
      if (
        articleOwnerId &&
        articleOwnerId !== actorUserId &&
        !recipients.has(articleOwnerId)
      ) {
        const preferences = await this.getPreferences(articleOwnerId);
        if (preferences.notifyOnArticleComment) {
          await this.create({
            userId: articleOwnerId,
            type: NotificationType.ArticleCommented,
            title: `${actorName}さんが記事にコメントしました`,
            message: comment.articles.title,
            referenceId: comment.id,
            referenceType: "comment",
          });
        }
      }
    } catch (error) {
      console.error("Failed to create comment notification", error);
    }
  }

  async articlePublished(articleId: string, actorUserId: string) {
    if (!this.isEnabled()) return;
    try {
      const article = await prisma.articles.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          status: true,
          is_published: true,
          is_private: true,
          users: { select: { display_name: true, username: true } },
          article_tags: { select: { tag_id: true } },
        },
      });
      if (
        !article ||
        article.status !== "public" ||
        article.is_published !== true ||
        article.is_private === true
      ) return;

      const reasonsByUser = new Map<string, Set<NotificationReason>>();
      const tagIds = article.article_tags.map((tag) => tag.tag_id);

      if (tagIds.length > 0) {
        const tagFollowers = await prisma.tag_follows.findMany({
          where: { tag_id: { in: tagIds }, user_id: { not: actorUserId } },
          select: { user_id: true },
          distinct: ["user_id"],
        });
        for (const follower of tagFollowers) {
          const preferences = await this.getPreferences(follower.user_id);
          if (!preferences.notifyOnFollowedTagArticle) continue;
          const reasons = reasonsByUser.get(follower.user_id) ?? new Set<NotificationReason>();
          reasons.add("followed_tag");
          reasonsByUser.set(follower.user_id, reasons);
        }
      }

      const userFollowers = await prisma.user_follows.findMany({
        where: { followee_id: actorUserId, follower_id: { not: actorUserId } },
        select: { follower_id: true },
      });
      for (const follower of userFollowers) {
        const preferences = await this.getPreferences(follower.follower_id);
        if (!preferences.notifyOnFollowedUserArticle) continue;
        const reasons = reasonsByUser.get(follower.follower_id) ?? new Set<NotificationReason>();
        reasons.add("followed_user");
        reasonsByUser.set(follower.follower_id, reasons);
      }

      const actorName = article.users?.display_name ?? article.users?.username ?? "ユーザー";
      await Promise.all(
        [...reasonsByUser.entries()].map(async ([userId, reasonSet]) => {
          await notificationRepository.upsertArticlePublished({
            user_id: userId,
            title: `${actorName}さんが新しい記事を投稿しました`,
            message: article.title,
            reference_id: article.id,
            reasons: [...reasonSet],
          });
          notificationStreamService.notify(userId);
        }),
      );
    } catch (error) {
      console.error("Failed to create article published notification", error);
    }
  }
}

export const notificationService = new NotificationService();

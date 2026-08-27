import prisma from "../prisma/client.js";
import { notificationRepository } from "../repositories/notificationRepository.js";
import { notificationStreamService } from "./notificationStreamService.js";

export const NotificationType = {
  ArticleCommented: "article.comment.created",
  CommentReplied: "comment.reply.created",
  FollowedTagPublished: "tag.article.published",
} as const;

class NotificationService {
  async list(userId: string, limit?: number) {
    const notifications = await notificationRepository.findByUserId(userId, limit);

    return Promise.all(
      notifications.map(async (notification) => {
        let href: string | null = null;

        if (
          notification.reference_id &&
          (notification.type === NotificationType.ArticleCommented ||
            notification.type === NotificationType.CommentReplied)
        ) {
          const comment = await prisma.comments.findUnique({
            where: { id: notification.reference_id },
            select: {
              id: true,
              article_id: true,
              articles: {
                select: {
                  users: { select: { username: true } },
                },
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
          notification.type === NotificationType.FollowedTagPublished
        ) {
          const article = await prisma.articles.findUnique({
            where: { id: notification.reference_id },
            select: {
              id: true,
              users: { select: { username: true } },
            },
          });
          if (article?.users?.username) {
            href = `/${encodeURIComponent(article.users.username)}/${article.id}`;
          }
        }

        return { ...notification, href };
      }),
    );
  }

  async unreadCount(userId: string) {
    return { count: await notificationRepository.countUnread(userId) };
  }

  async markRead(userId: string, notificationId: string) {
    await notificationRepository.markRead(userId, notificationId);
    notificationStreamService.notify(userId);
  }

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
    notificationStreamService.notify(userId);
  }

  private async create(data: {
    userId: string;
    type: string;
    title: string;
    message?: string | null;
    referenceId?: string | null;
  }) {
    const notification = await notificationRepository.create({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      reference_id: data.referenceId,
    });
    notificationStreamService.notify(data.userId);
    return notification;
  }

  async commentCreated(commentId: string, actorUserId: string) {
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
          recipients.add(comment.comments.user_id);
          await this.create({
            userId: comment.comments.user_id,
            type: NotificationType.CommentReplied,
            title: `${actorName}さんがコメントに返信しました`,
            message: comment.body,
            referenceId: comment.id,
          });
        }
      }

      const articleOwnerId = comment.articles.user_id;
      if (
        articleOwnerId &&
        articleOwnerId !== actorUserId &&
        !recipients.has(articleOwnerId)
      ) {
        await this.create({
          userId: articleOwnerId,
          type: NotificationType.ArticleCommented,
          title: `${actorName}さんが記事にコメントしました`,
          message: comment.articles.title,
          referenceId: comment.id,
        });
      }
    } catch (error) {
      console.error("Failed to create comment notification", error);
    }
  }

  async articlePublished(articleId: string, actorUserId: string) {
    try {
      const article = await prisma.articles.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          status: true,
          is_published: true,
          is_private: true,
          article_tags: { select: { tag_id: true } },
        },
      });
      if (
        !article ||
        article.status !== "public" ||
        article.is_published !== true ||
        article.is_private === true
      ) return;

      const tagIds = article.article_tags.map((tag) => tag.tag_id);
      if (tagIds.length === 0) return;

      const followers = await prisma.tag_follows.findMany({
        where: {
          tag_id: { in: tagIds },
          user_id: { not: actorUserId },
        },
        select: { user_id: true },
        distinct: ["user_id"],
      });

      await Promise.all(
        followers.map((follower) =>
          this.create({
            userId: follower.user_id,
            type: NotificationType.FollowedTagPublished,
            title: "フォロー中のタグに新しい記事が投稿されました",
            message: article.title,
            referenceId: article.id,
          }),
        ),
      );
    } catch (error) {
      console.error("Failed to create followed tag notification", error);
    }
  }
}

export const notificationService = new NotificationService();

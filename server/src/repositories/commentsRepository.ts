import { PrismaClient } from "@prisma/client";
import prisma from "../prisma/client.js";

export class CommentsRepository {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  async findByArticleId(articleId: string) {
    return this.db.comments.findMany({
      where: { article_id: articleId },
      orderBy: { created_at: "asc" },
      include: {
        users: {
          select: {
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async create(data: {
    article_id: string;
    user_id: string;
    body: string;
    parent_comment_id?: string;
  }) {
    return this.db.comments.create({
      data,
      include: {
        users: {
          select: {
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async softDelete(commentId: string, userId: string, allowAny = false) {
    return this.db.comments.updateMany({
      where: allowAny ? { id: commentId } : { id: commentId, user_id: userId },
      data: { is_deleted: true },
    });
  }

  async isLiked(commentId: string, userId: string) {
    return this.db.comment_likes.findUnique({
      where: { comment_id_user_id: { comment_id: commentId, user_id: userId } },
    });
  }

  async getCommentLikeUserByCommentId(commentId: string) {
    return this.db.comment_likes.findMany({
      where: { comment_id: commentId },
      include: { users: true },
    });
  }

  async addLike(commentId: string, userId: string) {
    return this.db.comment_likes.create({
      data: { comment_id: commentId, user_id: userId },
    });
  }

  async removeLike(commentId: string, userId: string) {
    return this.db.comment_likes.delete({
      where: { comment_id_user_id: { comment_id: commentId, user_id: userId } },
    });
  }
}

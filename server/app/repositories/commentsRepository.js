import prisma from "../prisma/client.js";
export class CommentsRepository {
    constructor() {
        this.db = prisma;
    }
    // 記事に紐づくコメントを全件取得（作成日時順）
    async findByArticleId(articleId) {
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
    // 新規コメント作成（返信の場合は parent_comment_id が入る）
    async create(data) {
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
    // 削除（論理削除フラグを更新）
    async softDelete(commentId, userId) {
        return this.db.comments.updateMany({
            where: { id: commentId, user_id: userId },
            data: { is_deleted: true },
        });
    }
    async isLiked(commentId, userId) {
        return this.db.comment_likes.findUnique({
            where: { comment_id_user_id: { comment_id: commentId, user_id: userId } }
        });
    }
    async getCommentLikeUserByCommentId(commentId) {
        return this.db.comment_likes.findMany({
            where: { comment_id: commentId },
            include: { users: true }
        });
    }
    async addLike(commentId, userId) {
        return this.db.comment_likes.create({
            data: { comment_id: commentId, user_id: userId }
        });
    }
    async removeLike(commentId, userId) {
        return this.db.comment_likes.delete({
            where: { comment_id_user_id: { comment_id: commentId, user_id: userId } }
        });
    }
}

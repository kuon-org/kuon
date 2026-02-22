import { CommentsRepository } from "../repositories/commentsRepository.js";

export class CommentsService {
    constructor(private commentsRepo: CommentsRepository) { }

    async getCommentsByArticle(articleId: string) {
        return await this.commentsRepo.findByArticleId(articleId);
    }

    async postComment(userId: string, articleId: string, payload: any) {
        if (!payload.body) throw new Error("CommentBodyRequired");

        return await this.commentsRepo.create({
            article_id: articleId,
            user_id: userId,
            body: payload.body,
            parent_comment_id: payload.parent_comment_id || null,
        });
    }

    async deleteComment(commentId: string, userId: string) {
        return await this.commentsRepo.softDelete(commentId, userId);
    }

    async getCommentLikeUserWithCount(commentId: string) {
        const likeRecord = await this.commentsRepo.getCommentLikeUserByCommentId(commentId);
        const likeUsers = likeRecord.map((record: any) => record.users);
        return {
            like_users: likeUsers,
            like_count: likeUsers.length
        }
    }

    async getIsLiked(commentId: string, userId: string) {
        const isLike = await this.commentsRepo.isLiked(commentId, userId);
        return !!isLike;
    }

    async toggleLike(commentId: string, userId: string) {
        const existing = await this.commentsRepo.isLiked(commentId, userId);
        if (existing) {
            await this.commentsRepo.removeLike(commentId, userId);
            return { isLike: false, message: "いいねを解除しました" }
        } else {
            await this.commentsRepo.addLike(commentId, userId);
            return { isLike: true, message: "いいねしました" };
        }
    }
}
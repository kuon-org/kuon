export class CommentsService {
    constructor(commentsRepo) {
        this.commentsRepo = commentsRepo;
    }
    async getCommentsByArticle(articleId) {
        return await this.commentsRepo.findByArticleId(articleId);
    }
    async postComment(userId, articleId, payload) {
        if (!payload.body)
            throw new Error("CommentBodyRequired");
        return await this.commentsRepo.create({
            article_id: articleId,
            user_id: userId,
            body: payload.body,
            parent_comment_id: payload.parent_comment_id || null,
        });
    }
    async deleteComment(commentId, userId) {
        return await this.commentsRepo.softDelete(commentId, userId);
    }
    async getCommentLikeUserWithCount(commentId) {
        const likeRecord = await this.commentsRepo.getCommentLikeUserByCommentId(commentId);
        const likeUsers = likeRecord.map((record) => record.users);
        return {
            like_users: likeUsers,
            like_count: likeUsers.length
        };
    }
    async getIsLiked(commentId, userId) {
        const isLike = await this.commentsRepo.isLiked(commentId, userId);
        return !!isLike;
    }
    async toggleLike(commentId, userId) {
        const existing = await this.commentsRepo.isLiked(commentId, userId);
        if (existing) {
            await this.commentsRepo.removeLike(commentId, userId);
            return { isLike: false, message: "いいねを解除しました" };
        }
        else {
            await this.commentsRepo.addLike(commentId, userId);
            return { isLike: true, message: "いいねしました" };
        }
    }
}

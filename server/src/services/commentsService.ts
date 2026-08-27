import { CommentsRepository } from "../repositories/commentsRepository.js";
import { webhookDispatcherService } from "./webhookDispatcherService.js";
import { webhookEventContextService } from "./webhookEventContextService.js";
import { WebhookEventType } from "../webhooks/events.js";

type CommentRecord = Awaited<
  ReturnType<CommentsRepository["findByArticleId"]>
>[number];

type CommentResponse = Omit<CommentRecord, "body" | "user_id" | "users"> & {
  body: string | null;
  user_id: string | null;
  users: CommentRecord["users"] | null;
};

export class CommentsService {
  constructor(private commentsRepo: CommentsRepository) {}

  async getCommentsByArticle(articleId: string): Promise<CommentResponse[]> {
    const comments = await this.commentsRepo.findByArticleId(articleId);

    return comments.map((comment) => {
      if (!comment.is_deleted) return comment;

      return {
        ...comment,
        body: null,
        user_id: null,
        users: null,
      };
    });
  }

  async postComment(userId: string, articleId: string, payload: any) {
    if (!payload.body) throw new Error("CommentBodyRequired");

    const comment = await this.commentsRepo.create({
      article_id: articleId,
      user_id: userId,
      body: payload.body,
      parent_comment_id: payload.parent_comment_id || null,
    });

    void this.dispatchCommentCreated(comment.id);
    return comment;
  }

  private async dispatchCommentCreated(commentId: string) {
    try {
      const { context, recipientUserId } =
        await webhookEventContextService.commentCreated(commentId);
      await webhookDispatcherService.dispatch(WebhookEventType.CommentCreated, context, {
        recipientUserId,
      });
    } catch (error) {
      console.error("Failed to dispatch comment.created webhook", error);
    }
  }

  async deleteComment(commentId: string, userId: string, allowAny = false) {
    return await this.commentsRepo.softDelete(commentId, userId, allowAny);
  }

  async getCommentLikeUserWithCount(commentId: string) {
    const likeRecord = await this.commentsRepo.getCommentLikeUserByCommentId(commentId);
    const likeUsers = likeRecord.map((record: any) => record.users);
    return { like_users: likeUsers, like_count: likeUsers.length };
  }

  async getIsLiked(commentId: string, userId: string) {
    const isLike = await this.commentsRepo.isLiked(commentId, userId);
    return !!isLike;
  }

  async toggleLike(commentId: string, userId: string) {
    const existing = await this.commentsRepo.isLiked(commentId, userId);
    if (existing) {
      await this.commentsRepo.removeLike(commentId, userId);
      return { isLike: false, message: "いいねを解除しました" };
    }

    await this.commentsRepo.addLike(commentId, userId);
    return { isLike: true, message: "いいねしました" };
  }
}

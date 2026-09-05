import { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { CommentsService } from "../services/commentsService.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";

export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  getComments = async (req: Request, res: Response) => {
    try {
      const comments = await this.commentsService.getCommentsByArticle(
        String(req.params.articleId),
      );
      res.json(comments);
    } catch (error) {
      console.error("Comment list fetch failed", error);
      throw new AppError(500, "COMMENT_LIST_FETCH_FAILED", "Failed to fetch comments");
    }
  };

  createComment = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    try {
      const newComment = await this.commentsService.postComment(
        req.user.userId,
        String(req.params.articleId),
        req.body,
      );
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Comment creation failed", error);
      throw new AppError(400, "COMMENT_CREATE_FAILED", "Failed to create comment");
    }
  };

  deleteComment = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    try {
      await this.commentsService.deleteComment(
        String(req.params.commentId),
        req.user.userId,
        req.authorization?.resourceScope === "any",
      );
      res.status(200).json({ message: "success" });
    } catch (error) {
      console.error("Comment deletion failed", error);
      throw new AppError(400, "COMMENT_DELETE_FAILED", "Failed to delete comment");
    }
  };

  getCommentLikeUserByCommentId = async (req: Request, res: Response) => {
    try {
      const detail = await this.commentsService.getCommentLikeUserWithCount(
        String(req.params.commentId),
      );
      res.json(detail);
    } catch (error) {
      console.error("Comment likes fetch failed", error);
      throw new AppError(500, "COMMENT_LIKES_FETCH_FAILED", "Failed to fetch comment likes");
    }
  };

  getIsLiked = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    try {
      const isLike = await this.commentsService.getIsLiked(
        String(req.params.commentId),
        req.user.userId,
      );
      res.json({ isLike });
    } catch (error) {
      console.error("Comment like state fetch failed", error);
      throw new AppError(500, "COMMENT_LIKE_STATE_FETCH_FAILED", "Failed to fetch comment like state");
    }
  };

  toggleLike = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    try {
      const result = await this.commentsService.toggleLike(
        String(req.params.commentId),
        req.user.userId,
      );
      res.json(result);
    } catch (error) {
      console.error("Comment like update failed", error);
      throw new AppError(500, "COMMENT_LIKE_UPDATE_FAILED", "Failed to update comment like state");
    }
  };
}

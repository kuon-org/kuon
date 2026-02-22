import { Request, Response } from 'express';
import { CommentsService } from '../services/commentsService.js';
import { AuthRequest, isAuthenticated } from '../middlewares/auth.js';

export class CommentsController {
    constructor(private commentsService: CommentsService) { }

    getComments = async (req: Request, res: Response) => {
        try {
            const comments = await this.commentsService.getCommentsByArticle(String(req.params.articleId));
            res.json(comments);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };

    createComment = async (req: AuthRequest, res: Response) => {
        try {
            if (!isAuthenticated(req)) return res.status(401).json({ message: "未ログインです" });

            const newComment = await this.commentsService.postComment(
                req.user.userId,
                String(req.params.articleId),
                req.body
            );
            res.status(201).json(newComment);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    };
    deleteComment = async (req: AuthRequest, res: Response) => {
        const commentId = String(req.params.commentId);
        try {
            if (!isAuthenticated(req)) return res.status(401).json({ message: "未ログインです" });

            const newComment = await this.commentsService.deleteComment(commentId, req.user.userId)

            res.status(201).json({ message: "success" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    };

    getCommentLikeUserByCommentId = async (req: Request, res: Response) => {
        try {
            const detail = await this.commentsService.getCommentLikeUserWithCount(String(req.params.commentId));
            res.json(detail);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    getIsLiked = async (req: AuthRequest, res: Response) => {
        try {
            if (!isAuthenticated(req)) return res.status(401).json({ message: "未ログインです" });
            const isLike = await this.commentsService.getIsLiked(String(req.params.commentId), req.user.userId);
            res.json({ isLike });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    toggleLike = async (req: AuthRequest, res: Response) => {
        try {
            if (!isAuthenticated(req)) return res.status(401).json({ message: "未ログインです" });
            const result = await this.commentsService.toggleLike(String(req.params.commentId), req.user.userId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

}
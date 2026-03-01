import { isAuthenticated } from '../middlewares/auth.js';
export class CommentsController {
    constructor(commentsService) {
        this.commentsService = commentsService;
        this.getComments = async (req, res) => {
            try {
                const comments = await this.commentsService.getCommentsByArticle(String(req.params.articleId));
                res.json(comments);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.createComment = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const newComment = await this.commentsService.postComment(req.user.userId, String(req.params.articleId), req.body);
                res.status(201).json(newComment);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        };
        this.deleteComment = async (req, res) => {
            const commentId = String(req.params.commentId);
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const newComment = await this.commentsService.deleteComment(commentId, req.user.userId);
                res.status(201).json({ message: "success" });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        };
        this.getCommentLikeUserByCommentId = async (req, res) => {
            try {
                const detail = await this.commentsService.getCommentLikeUserWithCount(String(req.params.commentId));
                res.json(detail);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.getIsLiked = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const isLike = await this.commentsService.getIsLiked(String(req.params.commentId), req.user.userId);
                res.json({ isLike });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.toggleLike = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const result = await this.commentsService.toggleLike(String(req.params.commentId), req.user.userId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
    }
}

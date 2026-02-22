import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { CommentsRepository } from "../repositories/commentsRepository.js";
import { CommentsService } from "../services/commentsService.js";
import { CommentsController } from "../controllers/commentsController.js";

const commentsRouter = Router();

const commentsRepo = new CommentsRepository();
const commentsService = new CommentsService(commentsRepo);
const commentsCtrl = new CommentsController(commentsService);

// 記事に対するコメント一覧取得
commentsRouter.get("/articles/:articleId/comments", commentsCtrl.getComments);

// 記事に対するコメント投稿
commentsRouter.post("/articles/:articleId/comments", authenticateToken, commentsCtrl.createComment);

commentsRouter.delete("/articles/:articleId/comments/:commentId", authenticateToken, commentsCtrl.deleteComment)

commentsRouter.post("/articles/:articleId/comments/:commentId/like", authenticateToken, commentsCtrl.toggleLike);

commentsRouter.get("/articles/:articleId/comments/:commentId/likes", commentsCtrl.getCommentLikeUserByCommentId);

commentsRouter.get("/articles/:articleId/comments/:commentId/isLike", authenticateToken, commentsCtrl.getIsLiked);



export default commentsRouter;
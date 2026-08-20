import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { CommentsRepository } from "../repositories/commentsRepository.js";
import { CommentsService } from "../services/commentsService.js";
import { CommentsController } from "../controllers/commentsController.js";
const commentsRouter = Router();
const commentsRepo = new CommentsRepository();
const commentsService = new CommentsService(commentsRepo);
const commentsCtrl = new CommentsController(commentsService);
/**
 * @openapi
 * /api/articles/{articleId}/comments:
 *   get:
 *     summary: 記事のコメント一覧取得
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 取得成功
 */
commentsRouter.get("/articles/:articleId/comments", commentsCtrl.getComments);
/**
 * @openapi
 * /api/articles/{articleId}/comments:
 *   post:
 *     summary: コメントの投稿
 *     tags:
 *       - Comments
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       '200':
 *         description: 投稿成功
 */
commentsRouter.post("/articles/:articleId/comments", authenticateToken, commentsCtrl.createComment);
/**
 * @openapi
 * /api/articles/{articleId}/comments/{commentId}:
 *   delete:
 *     summary: コメントの削除
 *     tags:
 *       - Comments
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 削除成功
 */
commentsRouter.delete("/articles/:articleId/comments/:commentId", authenticateToken, commentsCtrl.deleteComment);
/**
 * @openapi
 * /api/articles/{articleId}/comments/{commentId}/like:
 *   post:
 *     summary: コメントのいいね切り替え
 *     tags:
 *       - Comments
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 切り替え成功
 */
commentsRouter.post("/articles/:articleId/comments/:commentId/like", authenticateToken, commentsCtrl.toggleLike);
/**
 * @openapi
 * /api/articles/{articleId}/comments/{commentId}/likes:
 *   get:
 *     summary: コメントにいいねしたユーザの取得
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 取得成功
 */
commentsRouter.get("/articles/:articleId/comments/:commentId/likes", commentsCtrl.getCommentLikeUserByCommentId);
/**
 * @openapi
 * /api/articles/{articleId}/comments/{commentId}/isLike:
 *   get:
 *     summary: コメントに対するいいね状態の取得
 *     tags:
 *       - Comments
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 取得成功
 */
commentsRouter.get("/articles/:articleId/comments/:commentId/isLike", authenticateToken, commentsCtrl.getIsLiked);
export default commentsRouter;

import { Router } from "express";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";
import { ArticlesRepository } from "../repositories/articlesRepository.js";
import { UploadImagesRepository } from "../repositories/uploadImagesRepository.js";
import { ArticlesService } from "../services/articlesService.js";
import { UploadImagesService } from "../services/uploadImagesService.js";
import { ArticlesController } from "../controllers/articlesController.js";
const articlesRouter = Router();

// 1. インスタンス化 (Dependency Injection)
const articlesRepo = new ArticlesRepository();
const uploadImagesRepo = new UploadImagesRepository();

const articlesService = new ArticlesService(articlesRepo);
const uploadImagesService = new UploadImagesService(uploadImagesRepo);

const articlesCtrl = new ArticlesController(
  articlesService,
  uploadImagesService,
);

/**
 * @openapi
 * /api/articles:
 *   get:
 *     summary: 記事一覧取得
 *     tags:
 *       - Articles
 *     responses:
 *       '200':
 *         description: 取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Article'
 */
articlesRouter.get("/articles", articlesCtrl.getArticles);

articlesRouter.get("/articles/trends", articlesCtrl.getTrendingArticles);

/**
 * @openapi
 * /api/articles/me:
 *   get:
 *     summary: ログインユーザの記事一覧取得
 *     tags:
 *       - Articles
 *     responses:
 *      '200':
 *        description: 取得成功
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Articles'
 */
articlesRouter.get(
  "/articles/me",
  authenticateToken,
  articlesCtrl.getAllArticlesByUserId,
);

articlesRouter.get("/articles/user/:userId", articlesCtrl.getArticlesByUserId);

/**
 * @openapi
 * /api/articles/{articleId}.md:
 *   get:
 *     summary: 記事Markdownデータ取得
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 取得成功（Markdown）
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 */
articlesRouter.get(
  "/articles/:articleId.md",
  optionalAuth,
  articlesCtrl.getArticleMarkdown,
);

/**
 * @openapi
 * /api/articles/{articleId}:
 *   get:
 *     summary: 記事詳細取得
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 取得成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       '404':
 *         description: 見つかりません
 */
articlesRouter.get(
  "/articles/:articleId",
  optionalAuth,
  articlesCtrl.getArticle,
);

/**
 * @openapi
 * /api/articles/{articleId}/isowned:
 *   get:
 *     summary: 自分の記事かどうか
 *     tags:
 *       - Articles
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 判定結果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 owned:
 *                   type: boolean
 */
articlesRouter.get(
  "/articles/:articleId/isowned",
  authenticateToken,
  articlesCtrl.getArticleIsOwned,
);

/**
 * @openapi
 * /api/articles/{articleId}/like:
 *   post:
 *     summary: いいね切り替え
 *     tags:
 *       - Articles
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 成功
 */
articlesRouter.post(
  "/articles/:articleId/like",
  authenticateToken,
  articlesCtrl.toggleLike,
);

/**
 * @openapi
 * /api/articles/{articleId}/likes:
 *   get:
 *     summary: いいねしたユーザー一覧取得
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   name:
 *                     type: string
 */
articlesRouter.get(
  "/articles/:articleId/likes",
  articlesCtrl.getArticleLikeUserByArticleId,
);

/**
 * @openapi
 * /api/articles/{articleId}/islike:
 *   get:
 *     summary: 自分がいいねしたかどうか
 *     tags:
 *       - Articles
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 */
articlesRouter.get(
  "/articles/:articleId/islike",
  authenticateToken,
  articlesCtrl.getIsLiked,
);

/**
 * @openapi
 * /api/articles/create:
 *   post:
 *     summary: 記事新規作成
 *     tags:
 *       - Articles
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *             required: [title, body]
 *     responses:
 *       '201':
 *         description: 作成成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 */
articlesRouter.post(
  "/articles/create",
  authenticateToken,
  articlesCtrl.createArticle,
);

/**
 * @openapi
 * /api/articles/{articleId}/edit:
 *   patch:
 *     summary: 記事更新
 *     tags:
 *       - Articles
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
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       '200':
 *         description: 更新成功
 */
articlesRouter.patch(
  "/articles/:articleId/edit",
  authenticateToken,
  articlesCtrl.updateArticle,
);

/**
 * @opanapi
 * /api/articles/:articleId/rollback:
 *   post:
 *     summary: 下書き破棄
 *     tags: [Articles]
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 破棄成功
 */
articlesRouter.post(
  "/articles/:articleId/rollback",
  authenticateToken,
  articlesCtrl.rollBackDraft,
);

/**
 * @openapi
 * /api/articles/:articleId:
 *   delete:
 *     summary: 記事の論理削除
 *     tags: [Articles]
 *     security:
 *       - CookieAuth: []
 *    parameters:
 *      - in: path
 *        name: articleId
 *       required: true
 *      schema:
 *        type: string
 *    responses:
 *     '200':
 *        description: 削除成功
 */
articlesRouter.delete(
  "/articles/:articleId",
  authenticateToken,
  articlesCtrl.deleteArticle,
);

/**
 * @openapi
 * /api/articles/trash/list:
 *   get:
 *     summary: ゴミ箱の記事一覧取得
 *    tags: [Articles]
 *    security:
 *      - CookieAuth: []
 *    responses:
 *     '200':
 *        description: 取得成功
 */
articlesRouter.get(
  "/articles/trash/list",
  authenticateToken,
  articlesCtrl.getDeletedArticlesByUserId,
);

/**
 * @openapi
 * /api/articles/{articleId}/restore:
 *   post:
 *    summary: 記事の復元
 *   tags: [Articles]
 *  security:
 *     - CookieAuth: []
 *  parameters:
 *    - in: path
 *     name: articleId
 *    required: true
 *    schema:
 *      type: string
 *    responses:
 *      '200':
 *        description: 復元成功
 */
articlesRouter.post(
  "/articles/:articleId/restore",
  authenticateToken,
  articlesCtrl.restoreArticle,
);

/**
 * @openapi
 * /api/articles/{articleId}/hard:
 *  delete:
 *   summary: 記事の物理削除
 *  tags: [Articles]
 *  security:
 *  - CookieAuth: []
 * parameters:
 *
 *  - in: path
 *  name: articleId
 * required: true
 * schema:
 *
 *  type: string
 *    responses:
 *  '200':
 *   description: 物理削除成功
 */
articlesRouter.delete(
  "/articles/:articleId/hard",
  authenticateToken,
  articlesCtrl.hardDeleteArticle,
);

/**
 * @openapi
 * /api/articles/upload:
 *   post:
 *     summary: 記事へのファイルアップロード
 *     tags: [Articles]
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *     responses:
 *       '200':
 *         description: 画像URL
 */
articlesRouter.post(
  "/articles/upload",
  authenticateToken,
  articlesCtrl.uploadArticleImage,
);

export default articlesRouter;

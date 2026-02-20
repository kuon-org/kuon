import { Router } from "express";
import {
  createArticle,
  getArticle,
  getArticleIsOwned,
  getArticleLikeUserByArticleId,
  getArticleMarkdown,
  getArticles,
  getArticlesByUserId,
  getIsLiked,
  toggleLike,
  updateArticle,
  uploadArticleImage,
} from "../controllers/articlesController.js";
import { authenticateToken } from "../middlewares/auth.js";

const articlesRouter = Router();

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
articlesRouter.get("/articles", getArticles);

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
articlesRouter.get("/articles/me", authenticateToken, getArticlesByUserId);



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
articlesRouter.get("/articles/:articleId.md", getArticleMarkdown);

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
articlesRouter.get("/articles/:articleId", getArticle);

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
  getArticleIsOwned
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
  toggleLike
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
  getArticleLikeUserByArticleId
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
articlesRouter.get("/articles/:articleId/islike", authenticateToken, getIsLiked);

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
articlesRouter.post("/articles/create", authenticateToken, createArticle);

/**
 * @openapi
 * /api/articles/{articleId}/edit:
 *   put:
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
articlesRouter.put("/articles/:articleId/edit", authenticateToken, updateArticle);

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
articlesRouter.post("/articles/upload", authenticateToken, uploadArticleImage);

export default articlesRouter;

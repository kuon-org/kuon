import { Router } from "express";
import { TagsController } from "../controllers/tagsController.js";
import { TagsRepository } from "../repositories/tagsRepository.js";
import { TagsService } from "../services/tagsService.js";
import { authenticateToken } from "../middlewares/auth.js";
const tagsRouter = Router();
const tagsRepo = new TagsRepository();
const tagsService = new TagsService(tagsRepo);
const tagsController = new TagsController(tagsService);
// タグ一覧取得
/**
 * @openapi
 * /api/tags:
 *   get:
 *     summary: タグ一覧取得
 *     tags:
 *       - Tags
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Tag' }
 */
tagsRouter.get("/tags", tagsController.getTags);
/**
 * @openapi
 * /api/tags/{slug}:
 *   get:
 *     summary: タグ詳細取得
 *     tags:
 *       - Tags
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tag' }
 */
tagsRouter.get("/tags/:slug", tagsController.getTag);
// タグの保存・更新（POST /api/tags）
/**
 * @openapi
 * /api/tags:
 *   post:
 *     summary: タグの保存・更新
 *     tags:
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               description: { type: string }
 *               avatar_url: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tag' }
 *       '401':
 *         description: 未ログイン
 */
tagsRouter.post("/tags", authenticateToken, tagsController.upsertTag);
/**
 * @openapi
 * /api/tags/{slug}/isFollowing:
 *   get:
 *     summary: タグのフォロー状態取得
 *     tags:
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFollow: { type: boolean }
 *       '401':
 *         description: 未ログイン
 */
tagsRouter.get("/tags/:slug/isFollowing", authenticateToken, tagsController.getIsFollowing);
/**
 * @openapi
 * /api/tags/{slug}/follow:
 *   post:
 *     summary: タグのフォロートグル
 *     tags:
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followed: { type: boolean }
 *       '401':
 *         description: 未ログイン
 */
tagsRouter.post("/tags/:slug/follow", authenticateToken, tagsController.toggleFollowing);
/**
 * @openapi
 * /api/tags/{slug}/upload_avatar:
 *   post:
 *     summary: タグアバターアップロード
 *     tags:
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string }
 *       '401':
 *         description: 未ログイン
 */
tagsRouter.post("/tags/:slug/upload_avatar", authenticateToken, tagsController.uploadTagAvatar);
export default tagsRouter;

import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { UsersService } from "../services/usersService.js";
import { UsersController } from "../controllers/usersController.js";
import { UploadImagesRepository } from "../repositories/uploadImagesRepository.js";
import { UploadImagesService } from "../services/uploadImagesService.js";
import { TagsRepository } from "../repositories/tagsRepository.js";
import { TagsService } from "../services/tagsService.js";
import { ArticlesRepository } from "../repositories/articlesRepository.js";
import { ServerSettingsService } from "../services/serverSettingsService.js";
import { ServerSettingsRepository } from "../repositories/serverSettingsRepository.js";

const usersRouter = Router();

// インスタンス化
const usersRepo = new UsersRepository();
const articlesRepos = new ArticlesRepository();
const serverSettingsRepos = new ServerSettingsRepository();
const serverSettingsService = new ServerSettingsService(serverSettingsRepos);
const usersService = new UsersService(
  usersRepo,
  articlesRepos,
  serverSettingsService,
);

// UploadImagesServiceが必要なため、こちらもインスタンス化
const uploadImagesRepo = new UploadImagesRepository();
const uploadImagesService = new UploadImagesService(uploadImagesRepo);

const tagsRepo = new TagsRepository();
const tagsService = new TagsService(tagsRepo);

const usersCtrl = new UsersController(
  usersService,
  tagsService,
  uploadImagesService,
);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: ユーザー一覧取得
 *     tags: [Users]
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 */
usersRouter.get("/users", usersCtrl.getUsers);

/**
 * @openapi
 * /api/users/id/{userId}:
 *   get:
 *     summary: ユーザーIDで取得
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       '404':
 *         description: 見つかりません
 */
usersRouter.get("/users/id/:userId", usersCtrl.getUserById);

/**
 * @openapi
 * /api/users/{username}:
 *   get:
 *     summary: ユーザー名で取得
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       '404':
 *         description: 見つかりません
 */
usersRouter.get("/users/:username", usersCtrl.getUserByUsername);

/**
 * @openapi
 * /api/me:
 *   get:
 *     summary: 自分自身のプロフィール取得（要JWT Cookie）
 *     tags: [Users]
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       '401':
 *         description: 未ログイン
 */
usersRouter.get("/me", authenticateToken, usersCtrl.getMe);

/**
 * @openapi
 * /api/register:
 *   post:
 *     summary: 新規登録
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:    { type: string }
 *               email:       { type: string, format: email }
 *               password:    { type: string }
 *               displayName: { type: string }
 *             required: [username, email, password]
 *     responses:
 *       '201':
 *         description: 作成成功
 *       '409':
 *         description: 競合（既に存在）
 */
usersRouter.post("/register", usersCtrl.registerUser);

/**
 * @openapi
 * /api/login:
 *   post:
 *     summary: ログイン（JWT を Cookie にセット）
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:    { type: string, format: email }
 *               password: { type: string }
 *             required: [email, password]
 *     responses:
 *       '200':
 *         description: 成功（Set-Cookie で access_token と refresh_token を返す）
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               access_token=eyJ...; HttpOnly; Path=/; SameSite=Lax; Max-Age=900000
 *               refresh_token=...; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800000
 *             schema: { type: string }
 *       '401':
 *         description: 認証失敗
 */
usersRouter.post("/login", usersCtrl.loginUser);

/**
 * @openapi
 * /api/login/verify-2fa:
 *   post:
 *     summary: 二段階認証コードの検証（JWT を Cookie にセット）
 *     description: |
 *       ログイン時に二段階認証が有効なユーザーが対象。
 *       メールアドレスと6桁の認証コードを送信し、正しければ JWT を Cookie にセットします。
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: "123456"
 *             required: [email, token]
 *     responses:
 *       '200':
 *         description: 二段階認証成功（Set-Cookie で access_token と refresh_token を返す）
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               access_token=eyJ...; HttpOnly; Path=/; SameSite=Lax; Max-Age=900000
 *               refresh_token=...; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800000
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 二段階認証が完了しました
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     username:
 *                       type: string
 *       '400':
 *         description: コードが無効または期限切れ
 *       '404':
 *         description: ユーザーまたは 2FA 設定が見つからない
 */
usersRouter.post("/login/verify-2fa", usersCtrl.verifyLogin2FA);

/**
 * @openapi
 * /api/refresh:
 *   post:
 *     summary: リフレッシュトークンでアクセストークンを更新
 *     tags: [Auth]
 *     responses:
 *       '200':
 *         description: 成功（Set-Cookie で access_token, refresh_token を更新）
 *       '401':
 *         description: リフレッシュトークンが無効または期限切れ
 */
usersRouter.post("/refresh", usersCtrl.refreshToken);

/**
 * @openapi
 * /api/logout:
 *   post:
 *     summary: ログアウト（JWT Cookie を削除）
 *     tags: [Auth]
 *     responses:
 *       '200':
 *         description: 成功（Cookie の削除）
 */
usersRouter.post("/logout", usersCtrl.logoutUser);

/**
 * @openapi
 * /api/devices:
 *   get:
 *     summary: デバイス一覧取得
 *     tags: [Users]
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/UserSession' }
 *       '401':
 *         description: 未ログイン
 */
usersRouter.get("/devices", authenticateToken, usersCtrl.getDevices);

/**
 * @openapi
 * /api/logout/all:
 *   post:
 *     summary: すべてのデバイスからログアウト
 *     tags: [Users]
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       '200':
 *         description: 成功
 *       '401':
 *         description: 未ログイン
 */
usersRouter.post("/logout/all", authenticateToken, usersCtrl.logoutAllDevices);

/**
 * @openapi
 * /api/logout/device/{sessionId}:
 *   post:
 *     summary: 特定のデバイスからログアウト
 *     tags: [Users]
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *       '401':
 *         description: 未ログイン
 *       '400':
 *         description: セッションIDが必要
 */
usersRouter.post(
  "/logout/device/:sessionId",
  authenticateToken,
  usersCtrl.logoutDevice,
);

/**
 * @openapi
 * /api/users/{userId}/password:
 *   put:
 *     summary: パスワード変更
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword: { type: string }
 *             required: [newPassword]
 *     responses:
 *       '200':
 *         description: 更新成功
 *       '404':
 *         description: 見つかりません
 */
usersRouter.put("/users/:userId/password", usersCtrl.changePassword);

/**
 * @openapi
 * /api/users/update/info:
 *   put:
 *     summary: ユーザ情報更新
 *     tags: [Users]
 *   requestBody:
 *     required: false
 *     content:
 *       application/json:
 *   responses:
 *     '200':
 *       description: 更新成功
 */
usersRouter.put(
  "/users/update/info",
  authenticateToken,
  usersCtrl.updateUserInfo,
);

/**
 * @openapi
 * /api/users/update/username:
 *   put:
 *     summary: ユーザ名情報更新
 *     tags: [Users]
 *   requestBody:
 *     required: false
 *     content:
 *       application/json:
 *   responses:
 *     '200':
 *       description: 更新成功
 */
usersRouter.put(
  "/users/update/username",
  authenticateToken,
  usersCtrl.updateUsername,
);

/**
 * @openapi
 * /api/users/follow:
 *   post:
 *     summary: フォロー
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followeeId: { type: string }
 *             required: [followeeId]
 *     responses:
 *       '200':
 *         description: 更新成功
 *       '401':
 *         description: 未ログインです
 */
usersRouter.post("/users/follow", authenticateToken, usersCtrl.toggleFollow);

/**
 * @openapi
 * /api/users/{followeeId}/isfollowing:
 *   get:
 *     summary: フォローしているか
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: followeeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 処理結果
 *       '401':
 *         description: 未ログインです
 */
usersRouter.get(
  "/users/:followeeId/isfollowing",
  authenticateToken,
  usersCtrl.isFollowing,
);

/**
 * @openapi
 * /api/users/{userId}/follower:
 *   get:
 *     summary: フォロワー一覧
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 処理結果
 */
usersRouter.get("/users/:userId/follower", usersCtrl.getFollowers);

/**
 * @openapi
 * /api/users/{userId}/follow:
 *   get:
 *     summary: フォロー一覧
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 処理結果
 */
usersRouter.get("/users/:userId/follow", usersCtrl.getFollowings);

/**
 * @openapi
 * /api/users/settings/setup2fa:
 *   get:
 *     summary: 2FAのセットアップ
 *     tags: [Users]
 *     responses:
 *       '200':
 *         description: QRコードURL
 */
usersRouter.get(
  "/users/settings/setup2fa",
  authenticateToken,
  usersCtrl.setUp2FA,
);

/**
 * @openapi
 * /api/users/settings/verify2fa:
 *   post:
 *     summary: 2FAの検証
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *             required: [token]
 *     response:
 *       '200':
 *         description: 二段階認証有効化
 */
usersRouter.post(
  "/users/settings/verify2fa",
  authenticateToken,
  usersCtrl.verify2FA,
);

/**
 * @openapi
 * /api/users/settings/delete2fa:
 *   delete:
 *     summary: 2FAの削除
 *     tags: [Users]
 *   response:
 *     '200':
 *       description: 二段階認証削除
 */
usersRouter.delete(
  "/users/settings/delete2fa",
  authenticateToken,
  usersCtrl.delete2FA,
);

/**
 * @openapi
 * /api/users/settings/uploaded_images:
 *   get:
 *     summary: ユーザのアップロードした画像一覧取得
 *     tags: [Users]
 *     response:
 *       '200':
 *         description: 取得結果
 */
usersRouter.get(
  "/users/settings/uploaded_images",
  authenticateToken,
  usersCtrl.getUploadedImages,
);

/**
 * @openapi
 * /api/users/settings/idpinfo:
 *   get:
 *     summary: ユーザのidp情報一覧
 *     tags: [Users]
 *     response:
 *       '200':
 *         description: 取得結果
 */
usersRouter.get(
  "/users/settings/idpinfo",
  authenticateToken,
  usersCtrl.getUserIdentities,
);

/**
 * @openapi
 * /api/users/settings/upload_avatar:
 *   post:
 *     summary: ローカルプロフィール画像アップロード
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *     responses:
 *       '200':
 *         description: 画像URL
 */
usersRouter.post(
  "/users/settings/upload_avatar",
  authenticateToken,
  usersCtrl.uploadLocalAvatar,
);

usersRouter.get("/users/:userId/following_tags", usersCtrl.getFollowingTags);

/**
 * @openapi
 * /api/users/tags/me:
 *   get:
 *     summary: 自分のフォロー中のタグ一覧取得
 *     tags:
 *       - Users
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Tag' }
 *       '401':
 *         description: 未ログイン
 */
usersRouter.get(
  "/users/tags/me",
  authenticateToken,
  usersCtrl.getMyFollowingtags,
);

/**
 * @openapi
 * /api/users/{userId}/pickup:
 *   get:
 *     summary: ユーザーのピックアップ記事一覧取得
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Article' }
 */
usersRouter.get("/users/:userId/pickup", usersCtrl.getPickupArticles);

/**
 * @openapi
 * /api/users/pickup/create:
 *   post:
 *     summary: ピックアップ記事作成
 *     tags:
 *       - Users
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               articleId: { type: string }
 *             required: [articleId]
 *     responses:
 *       '200':
 *         description: 成功
 *       '401':
 *         description: 未ログイン
 */
usersRouter.post(
  "/users/pickup/create",
  authenticateToken,
  usersCtrl.createPickupArticle,
);

/**
 * @openapi
 * /api/users/pickup/delete:
 *   post:
 *     summary: ピックアップ記事削除
 *     tags:
 *       - Users
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               articleId: { type: string }
 *             required: [articleId]
 *     responses:
 *       '200':
 *         description: 成功
 *       '401':
 *         description: 未ログイン
 */
usersRouter.post(
  "/users/pickup/delete",
  authenticateToken,
  usersCtrl.deletePickupArticle,
);

/**
 * @openapi
 * /api/users/{userId}/comments:
 *   get:
 *     summary: ユーザーのコメント数取得
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
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
 *                 commentCount: { type: integer }
 */
usersRouter.get("/users/:userId/comments", usersCtrl.getCommentCount);

/**
 * @openapi
 * /api/users/{userId}/articles:
 *   get:
 *     summary: ユーザーの記事数取得
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
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
 *                 articleCount: { type: integer }
 */
usersRouter.get("/users/:userId/articles", usersCtrl.getArticleCount);

/**
 * @openapi
 * /api/users/ranking/all:
 *   get:
 *     summary: 全ユーザーランキング取得
 *     tags:
 *       - Users
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 */
usersRouter.get("/users/ranking/all", usersCtrl.getAllRanking);

/**
 * @openapi
 * /api/users/settings/api-keys:
 *   get:
 *     summary: ユーザのAPIキー一覧取得
 *     tags:
 *       - Users
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
usersRouter.get(
  "/users/settings/api-keys",
  authenticateToken,
  usersCtrl.getApiKeys,
);
/**
 * @openapi
 * /api/users/settings/api-keys:
 *   post:
 *     summary: APIキー作成
 *     tags:
 *       - Users
 *     responses:
 *       '201':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
usersRouter.post(
  "/users/settings/api-keys",
  authenticateToken,
  usersCtrl.createApiKey,
);

/**
 * @openapi
 * /api/users/settings/api-keys/{keyId}:
 *   post:
 *     summary: APIキー失効
 *     tags:
 *       - Users
 *     responses:
 *       '200':
 *         description: 成功
 */
usersRouter.delete(
  "/users/settings/api-keys/:apiKeyId",
  authenticateToken,
  usersCtrl.revokeApiKey,
);

export default usersRouter;

import { Router } from "express";
import {
  getUsers,
  getUserById,
  getUserByUsername,
  registerUser,
  loginUser,
  changePassword,
  getMe,
  logoutUser,
  toggleFollow,
  isFollowing,
  getFollowings,
  getFollowers,
  setUp2FA,
  verify2FA,
  verifyLogin2FA,
  getUploadedImages,
  updateUserInfo,
  updateUsername,
  getUserIdentities,
  uploadLocalAvatar,
} from "../controllers/usersController.js";
import { authenticateToken } from "../middlewares/auth.js";

const usersRouter = Router();

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
usersRouter.get("/users", getUsers);

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
usersRouter.get("/users/id/:userId", getUserById);

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
usersRouter.get("/users/:username", getUserByUsername);

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
usersRouter.get("/me", authenticateToken, getMe);

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
usersRouter.post("/register", registerUser);

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
 *         description: 成功（Set-Cookie で token を返す）
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               token=eyJ...; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400
 *             schema: { type: string }
 *       '401':
 *         description: 認証失敗
 */
usersRouter.post("/login", loginUser);

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
 *         description: 二段階認証成功（Set-Cookie で token を返す）
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               token=eyJ...; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400
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
usersRouter.post("/login/verify-2fa", verifyLogin2FA);


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
usersRouter.post("/logout", logoutUser);

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
usersRouter.put("/users/:userId/password", changePassword);

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
usersRouter.put("/users/update/info", authenticateToken, updateUserInfo)

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
usersRouter.put("/users/update/username", authenticateToken, updateUsername)



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
usersRouter.post("/users/follow", authenticateToken, toggleFollow)


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
usersRouter.get("/users/:followeeId/isfollowing", authenticateToken, isFollowing);

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
usersRouter.get("/users/:userId/follower", getFollowers);

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
usersRouter.get("/users/:userId/follow", getFollowings);


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
usersRouter.get("/users/settings/setup2fa", authenticateToken, setUp2FA)

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
usersRouter.post("/users/settings/verify2fa", authenticateToken, verify2FA)

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
usersRouter.get("/users/settings/uploaded_images", authenticateToken, getUploadedImages)

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
usersRouter.get("/users/settings/idpinfo", authenticateToken, getUserIdentities)

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
usersRouter.post("/users/settings/upload_avatar", authenticateToken, uploadLocalAvatar);

export default usersRouter;
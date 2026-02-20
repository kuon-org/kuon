// src/routes/auth.ts
import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";

const authRouter = Router();
const authController = new AuthController();

/**
 * @opanapi
 * /auth/{provider}/login:
 *   get:
 *     summary: 外部Idpのログイン処理
 *     tags: [Auth]
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 外部認証プロバイダ名
 *     responses: 
 *       '200':
 *         description: パラメータの外部認証機構へリダイレクト
 */
authRouter.get("/auth/:provider/login", authController.login);

/**
 * @opanapi
 * /auth/{provider}/callback:
 *   get:
 *     summary: 外部Idpからのコールバック
 *     tags: [Auth]
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 外部認証プロバイダ名
 *     responses: 
 *       '200':
 *         description: ログイン成功
 */
authRouter.get("/auth/:provider/callback", optionalAuth, authController.callback);

/**
 * @openapi
 * /auth/avatar/select:
 *   post:
 *     summary: ユーザのアバター切り替え
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarId: { type: string }
 *             required: [avatarId]
 *     responses:
 *       '200':
 *         description: アバター更新成功
 */
authRouter.post("/auth/avatar/select",authenticateToken, authController.selectAvatar);

/**
 * @opanapi
 * /auth/{provider}/unlink:
 *   delete:
 *     summary: 外部アカウントの連携解除
 *     tags: [Auth]
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses: 
 *       '200':
 *         description: 解除成功   
 */
authRouter.delete("/auth/:provider/unlink", authenticateToken, authController.unlinkProvider)
export default authRouter;
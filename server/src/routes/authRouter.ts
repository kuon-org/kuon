// src/routes/auth.ts
import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";
import express from "express";
import { AuthService } from "../services/authService.js";
import { AuthRepository } from "../repositories/authRepository.js";
import { generateSamlServiceProviderMetadata } from "../services/samlMetadataService.js";
const authRouter = Router();
const authRepository = new AuthRepository();
const authSercice = new AuthService(authRepository);
const authController = new AuthController(authSercice);

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
authRouter.get("/auth/:provider/login", optionalAuth, authController.login);

/**
 * @openapi
 * /auth/{provider}/metadata:
 *   get:
 *     summary: SAML Service Provider Metadata
 *     tags: [Auth]
 */
authRouter.get("/auth/:provider/metadata", async (req, res) => {
  const metadata = await generateSamlServiceProviderMetadata(
    String(req.params.provider),
  );
  res.type("application/samlmetadata+xml").send(metadata);
});

/**
 * @opanapi
 * /auth/{provider}/callback:
 *   all:
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
authRouter.all(
  "/auth/:provider/callback",
  express.urlencoded({ extended: false }),
  optionalAuth,
  authController.callback,
);

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
authRouter.post(
  "/auth/avatar/select",
  authenticateToken,
  authController.selectAvatar,
);

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
authRouter.delete(
  "/auth/:provider/unlink",
  authenticateToken,
  authController.unlinkProvider,
);
export default authRouter;

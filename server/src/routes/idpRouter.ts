import { Router, Request, Response } from "express";
import { IdpConfigurationRepository } from "../repositories/idpConfigurationsRepository.js";
import { IdpConfigurationsService } from "../services/idpConfigurationsService.js";
import { IdpController } from "../controllers/idpControllers.js";
import { authenticateToken } from "../middlewares/auth.js";
import { UsersRepository } from "../repositories/usersRepository.js";

const idpRouter = Router();

const idpConfRepo = new IdpConfigurationRepository();
const usersRepo = new UsersRepository();
const idpConfService = new IdpConfigurationsService(idpConfRepo, usersRepo);
const idpConfController = new IdpController(idpConfService);

/**
 * @openapi
 * /api/idp/active:
 *   get:
 *     summary: アクティブなIDPプロバイダー一覧取得
 *     tags:
 *       - IDP
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/IdpProvider' }
 */
idpRouter.get("/idp/active", idpConfController.getActiveIdp);

/**
 * @openapi
 * /api/admin/idp_list:
 *   get:
 *     summary: 全IDPプロバイダー一覧取得 (管理者)
 *     tags:
 *       - IDP
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/IdpProvider' }
 *       '401':
 *         description: 未ログイン
 */
idpRouter.get(
  "/admin/idp_list",
  authenticateToken,
  idpConfController.getAllProviders,
);

/**
 * @openapi
 * /api/admin/idp_settings/discovery:
 *   get:
 *     summary: OIDCディスカバリー
 *     tags:
 *       - IDP
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: issuer_host
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
 *                 auth_url: { type: string }
 *                 token_url: { type: string }
 *                 user_info_url: { type: string }
 *       '400':
 *         description: issuer_hostが必要
 *       '401':
 *         description: 未ログイン
 */
idpRouter.get(
  "/admin/idp_settings/discovery",
  authenticateToken,
  idpConfController.discoverOidc,
);

/**
 * @openapi
 * /api/admin/idp_settings/{provider_name}:
 *   get:
 *     summary: IDP設定取得 (管理者)
 *     tags:
 *       - IDP
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider_name
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/IdpConfiguration' }
 *       '401':
 *         description: 未ログイン
 */
idpRouter.get(
  "/admin/idp_settings/:provider_name",
  authenticateToken,
  idpConfController.getIdpConf,
);

/**
 * @openapi
 * /api/admin/idp_settings/{provider_name}:
 *   delete:
 *     summary: IDP設定削除 (管理者)
 *     tags:
 *       - IDP
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider_name
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *       '401':
 *         description: 未ログイン
 */
idpRouter.delete(
  "/admin/idp_settings/:provider_name",
  authenticateToken,
  idpConfController.deleteIdp,
);

/**
 * @openapi
 * /api/admin/idp_settings:
 *   post:
 *     summary: IDP設定保存・更新 (管理者)
 *     tags:
 *       - IDP
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider_name: { type: string }
 *               config: { type: object }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/IdpConfiguration' }
 *       '400':
 *         description: provider_nameが必要
 *       '401':
 *         description: 未ログイン
 */
idpRouter.post(
  "/admin/idp_settings",
  authenticateToken,
  idpConfController.upsertIdp,
);

/**
 * @openapi
 * /api/admin/idp_settings/toggle_active/{provider_name}:
 *   post:
 *     summary: IDPアクティブ状態トグル (管理者)
 *     tags:
 *       - IDP
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider_name
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *       '401':
 *         description: 未ログイン
 */
idpRouter.post(
  "/admin/idp_settings/toggle_active/:provider_name",
  authenticateToken,
  idpConfController.toggleActive,
);
export default idpRouter;

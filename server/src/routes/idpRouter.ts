import { Router, Request, Response } from "express";
import { IdpConfigurationRepository } from "../repositories/idpConfigurationsRepository.js";
import { IdpConfigurationsService } from "../services/idpConfigurationsService.js";
import { IdpController } from "../controllers/idpControllers.js";
import { authenticateToken } from "../middlewares/auth.js";
import { requirePermission } from "../middlewares/permission.js";
import { Permissions } from "../constants/permissions.js";
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

// All /admin IdP routes require the same capability. Individual authenticateToken
// middleware is kept below for compatibility and to keep route definitions explicit.
idpRouter.use(
  "/admin",
  authenticateToken,
  requirePermission(Permissions.System.IdpManage),
);

/**
 * @openapi
 * /api/admin/idp_list:
 *   get:
 *     summary: 全IDPプロバイダー一覧取得 (管理者)
 *     tags:
 *       - IDP
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
 */
idpRouter.get(
  "/admin/idp_settings/discovery",
  authenticateToken,
  idpConfController.discoverOidc,
);

/**
 * @openapi
 * /api/admin/idp_settings/{provider_name}/test:
 *   post:
 *     summary: 現在有効なIDP設定の疎通確認
 *     tags:
 *       - IDP
 */
idpRouter.post(
  "/admin/idp_settings/:provider_name/test",
  authenticateToken,
  idpConfController.testConnectivity,
);

/**
 * @openapi
 * /api/admin/idp_registry/{provider_name}:
 *   delete:
 *     summary: 未構成・未参照のIDP Registryをクリーンアップ
 *     tags:
 *       - IDP
 */
idpRouter.delete(
  "/admin/idp_registry/:provider_name",
  authenticateToken,
  idpConfController.cleanupOrphanProvider,
);

/**
 * @openapi
 * /api/admin/idp_settings/{provider_name}:
 *   get:
 *     summary: IDP設定取得 (管理者)
 *     tags:
 *       - IDP
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
 */
idpRouter.post(
  "/admin/idp_settings/toggle_active/:provider_name",
  authenticateToken,
  idpConfController.toggleActive,
);
export default idpRouter;

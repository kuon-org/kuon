import { Router } from "express";
import { UsersRepository } from "../repositories/usersRepository.js";
import { AdminService } from "../services/adminService.js";
import { AdminController } from "../controllers/adminController.js";
import { authenticateToken } from "../middlewares/auth.js";
import { AdminRepository } from "../repositories/adminRepository.js";
import { ServerSettingsRepository } from "../repositories/serverSettingsRepository.js";
import { ServerSettingsService } from "../services/serverSettingsService.js";

const adminRouter = Router();

const usersRepo = new UsersRepository();
const adminRepo = new AdminRepository();
const serverSettingsRepo = new ServerSettingsRepository();
const adminService = new AdminService(usersRepo, adminRepo);
const serverSettingsService = new ServerSettingsService(serverSettingsRepo);
const adminController = new AdminController(adminService, serverSettingsService);

/**
 * @openapi
 * /api/admin/settings/users:
 *   get:
 *     summary: 管理者用ユーザー一覧取得
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       '401':
 *         description: 未ログイン
 *       '403':
 *         description: 権限なし
 */
adminRouter.get(
  "/admin/settings/users",
  authenticateToken,
  adminController.getUserList,
);

/**
 * @openapi
 * /api/admin/settings/users/toggle_active/{userId}:
 *   post:
 *     summary: ユーザーのアクティブ状態トグル
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
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
 *                 active: { type: boolean }
 *       '401':
 *         description: 未ログイン
 *       '403':
 *         description: 権限なし
 */
adminRouter.post(
  "/admin/settings/users/toggle_active/:userId",
  authenticateToken,
  adminController.toggleUserActive,
);

/**
 * @openapi
 * /api/admin/settings/server:
 *   get:
 *     summary: サーバ設定一覧取得
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: 成功
 *       '401':
 *         description: 未ログイン
 *       '403':
 *         description: 権限なし
 */
adminRouter.get(
  "/admin/settings/server",
  authenticateToken,
  adminController.getServerSettings,
);

/**
 * @openapi
 * /api/admin/settings/server:
 *   put:
 *     summary: サーバ設定を更新
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       '200':
 *         description: 成功
 *       '400':
 *         description: 不正なリクエスト
 *       '401':
 *         description: 未ログイン
 *       '403':
 *         description: 権限なし
 */
adminRouter.put(
  "/admin/settings/server",
  authenticateToken,
  adminController.updateServerSetting,
);

export default adminRouter;

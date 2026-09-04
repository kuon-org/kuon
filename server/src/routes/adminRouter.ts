import { Router } from "express";
import multer from "multer";
import { tmpdir } from "node:os";
import { AdminService } from "../services/adminService.js";
import { AdminController } from "../controllers/adminController.js";
import { BackupController } from "../controllers/backupController.js";
import { RestoreController } from "../controllers/restoreController.js";
import { WebhookController } from "../controllers/webhookController.js";
import { webhookSelectionController } from "../controllers/webhookSelectionController.js";
import { mailController } from "../controllers/mailController.js";
import { roleController } from "../controllers/roleController.js";
import { adminStatusController } from "../controllers/adminStatusController.js";
import { authenticateToken } from "../middlewares/auth.js";
import { requirePermission } from "../middlewares/permission.js";
import { Permissions } from "../constants/permissions.js";
import { AdminRepository } from "../repositories/adminRepository.js";
import { serverSettingsService } from "../services/serverSettingsService.js";
import { backupService } from "../services/backupService.js";
import { restoreService } from "../services/restoreService.js";
import { webhookService } from "../services/webhookService.js";
import { webhookPreviewService } from "../services/webhookPreviewService.js";

const adminRouter = Router();
const restoreUpload = multer({
  dest: tmpdir(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

const adminRepo = new AdminRepository();
const adminService = new AdminService(adminRepo);
const adminController = new AdminController(adminService, serverSettingsService);
const backupController = new BackupController(backupService);
const restoreController = new RestoreController(restoreService);
const webhookController = new WebhookController(
  webhookService,
  webhookPreviewService,
);

// Effective permissions for the current user. Used by the client to build the admin UI.
adminRouter.get(
  "/admin/permissions/me",
  authenticateToken,
  roleController.getMyPermissions,
);

adminRouter.get(
  "/admin/status",
  authenticateToken,
  requirePermission(Permissions.System.SettingsManage),
  adminStatusController.getStatus,
);

adminRouter.get(
  "/admin/settings/users",
  authenticateToken,
  requirePermission(Permissions.User.Read),
  adminController.getUserList,
);
adminRouter.post(
  "/admin/settings/users/toggle_active/:userId",
  authenticateToken,
  requirePermission(Permissions.User.Manage),
  adminController.toggleUserActive,
);
adminRouter.get(
  "/admin/settings/server",
  authenticateToken,
  requirePermission(Permissions.System.SettingsManage),
  adminController.getServerSettings,
);
adminRouter.put(
  "/admin/settings/server",
  authenticateToken,
  requirePermission(Permissions.System.SettingsManage),
  adminController.updateServerSetting,
);
adminRouter.get(
  "/admin/settings/smtp",
  authenticateToken,
  requirePermission(Permissions.System.SettingsManage),
  mailController.getSettings,
);
adminRouter.put(
  "/admin/settings/smtp",
  authenticateToken,
  requirePermission(Permissions.System.SettingsManage),
  mailController.updateSettings,
);
adminRouter.post(
  "/admin/settings/smtp/test",
  authenticateToken,
  requirePermission(Permissions.System.SettingsManage),
  mailController.sendTest,
);

adminRouter.get(
  "/admin/permissions",
  authenticateToken,
  requirePermission(Permissions.Role.Read),
  roleController.getPermissions,
);
adminRouter.get(
  "/admin/roles",
  authenticateToken,
  requirePermission(Permissions.Role.Read),
  roleController.getRoles,
);
adminRouter.post(
  "/admin/roles",
  authenticateToken,
  requirePermission(Permissions.Role.Create),
  roleController.createRole,
);
adminRouter.put(
  "/admin/roles/:roleId",
  authenticateToken,
  requirePermission(Permissions.Role.Update),
  roleController.updateRole,
);
adminRouter.delete(
  "/admin/roles/:roleId",
  authenticateToken,
  requirePermission(Permissions.Role.Delete),
  roleController.deleteRole,
);
adminRouter.put(
  "/admin/settings/users/:userId/roles",
  authenticateToken,
  requirePermission(Permissions.Role.Assign),
  roleController.assignUserRoles,
);

// 投稿画面向け。URLやHeaderは返さず、選択に必要な情報だけ公開する。
adminRouter.get(
  "/webhooks/available/article-published",
  authenticateToken,
  webhookSelectionController.getArticlePublishedTargets,
);

adminRouter.get(
  "/admin/webhooks/metadata",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.getMetadata,
);
adminRouter.post(
  "/admin/webhooks/preview",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.preview,
);
adminRouter.post(
  "/admin/webhooks/test",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.testSend,
);
adminRouter.get(
  "/admin/webhooks",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.getAll,
);
adminRouter.post(
  "/admin/webhooks",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.create,
);
adminRouter.get(
  "/admin/webhooks/:id/deliveries",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.getDeliveries,
);
adminRouter.patch(
  "/admin/webhooks/:id/active",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.setActive,
);
adminRouter.get(
  "/admin/webhooks/:id",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.getById,
);
adminRouter.put(
  "/admin/webhooks/:id",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.update,
);
adminRouter.delete(
  "/admin/webhooks/:id",
  authenticateToken,
  requirePermission(Permissions.System.WebhookManage),
  webhookController.delete,
);

adminRouter.post(
  "/admin/backup/export",
  authenticateToken,
  requirePermission(Permissions.System.BackupExecute),
  backupController.exportBackup,
);
adminRouter.post(
  "/admin/backup/restore",
  authenticateToken,
  requirePermission(Permissions.System.BackupExecute),
  restoreUpload.single("backup"),
  restoreController.restoreBackup,
);

export default adminRouter;

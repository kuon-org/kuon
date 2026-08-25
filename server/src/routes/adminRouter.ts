import { Router } from "express";
import multer from "multer";
import { tmpdir } from "node:os";
import { UsersRepository } from "../repositories/usersRepository.js";
import { AdminService } from "../services/adminService.js";
import { AdminController } from "../controllers/adminController.js";
import { BackupController } from "../controllers/backupController.js";
import { RestoreController } from "../controllers/restoreController.js";
import { WebhookController } from "../controllers/webhookController.js";
import { authenticateToken } from "../middlewares/auth.js";
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

const usersRepo = new UsersRepository();
const adminRepo = new AdminRepository();
const adminService = new AdminService(usersRepo, adminRepo);
const adminController = new AdminController(adminService, serverSettingsService);
const backupController = new BackupController(adminService, backupService);
const restoreController = new RestoreController(adminService, restoreService);
const webhookController = new WebhookController(
  adminService,
  webhookService,
  webhookPreviewService,
);

adminRouter.get("/admin/settings/users", authenticateToken, adminController.getUserList);
adminRouter.post("/admin/settings/users/toggle_active/:userId", authenticateToken, adminController.toggleUserActive);
adminRouter.get("/admin/settings/server", authenticateToken, adminController.getServerSettings);
adminRouter.put("/admin/settings/server", authenticateToken, adminController.updateServerSetting);
adminRouter.get("/admin/webhooks/metadata", authenticateToken, webhookController.getMetadata);
adminRouter.post("/admin/webhooks/preview", authenticateToken, webhookController.preview);
adminRouter.post("/admin/webhooks/test", authenticateToken, webhookController.testSend);
adminRouter.get("/admin/webhooks", authenticateToken, webhookController.getAll);
adminRouter.get("/admin/webhooks/:id", authenticateToken, webhookController.getById);
adminRouter.post("/admin/webhooks", authenticateToken, webhookController.create);
adminRouter.delete("/admin/webhooks/:id", authenticateToken, webhookController.delete);
adminRouter.post("/admin/backup/export", authenticateToken, backupController.exportBackup);
adminRouter.post(
  "/admin/backup/restore",
  authenticateToken,
  restoreUpload.single("backup"),
  restoreController.restoreBackup,
);

export default adminRouter;

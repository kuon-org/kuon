import { Router } from "express";
import { UsersRepository } from "../repositories/usersRepository.js";
import { AdminService } from "../services/adminService.js";
import { AdminController } from "../controllers/adminController.js";
import { BackupController } from "../controllers/backupController.js";
import { authenticateToken } from "../middlewares/auth.js";
import { AdminRepository } from "../repositories/adminRepository.js";
import { serverSettingsService } from "../services/serverSettingsService.js";
import { backupService } from "../services/backupService.js";

const adminRouter = Router();

const usersRepo = new UsersRepository();
const adminRepo = new AdminRepository();
const adminService = new AdminService(usersRepo, adminRepo);
const adminController = new AdminController(adminService, serverSettingsService);
const backupController = new BackupController(adminService, backupService);

adminRouter.get("/admin/settings/users", authenticateToken, adminController.getUserList);
adminRouter.post("/admin/settings/users/toggle_active/:userId", authenticateToken, adminController.toggleUserActive);
adminRouter.get("/admin/settings/server", authenticateToken, adminController.getServerSettings);
adminRouter.put("/admin/settings/server", authenticateToken, adminController.updateServerSetting);
adminRouter.post("/admin/backup/export", authenticateToken, backupController.exportBackup);

export default adminRouter;

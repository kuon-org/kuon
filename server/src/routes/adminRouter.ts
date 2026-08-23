import { Router } from "express";
import { UsersRepository } from "../repositories/usersRepository.js";
import { AdminService } from "../services/adminService.js";
import { AdminController } from "../controllers/adminController.js";
import { authenticateToken } from "../middlewares/auth.js";
import { AdminRepository } from "../repositories/adminRepository.js";
import { serverSettingsService } from "../services/serverSettingsService.js";

const adminRouter = Router();

const usersRepo = new UsersRepository();
const adminRepo = new AdminRepository();
const adminService = new AdminService(usersRepo, adminRepo);
const adminController = new AdminController(adminService, serverSettingsService);

adminRouter.get("/admin/settings/users", authenticateToken, adminController.getUserList);
adminRouter.post("/admin/settings/users/toggle_active/:userId", authenticateToken, adminController.toggleUserActive);
adminRouter.get("/admin/settings/server", authenticateToken, adminController.getServerSettings);
adminRouter.put("/admin/settings/server", authenticateToken, adminController.updateServerSetting);

export default adminRouter;

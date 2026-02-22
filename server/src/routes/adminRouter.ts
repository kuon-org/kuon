import { Router } from "express";
import { UsersRepository } from "../repositories/usersRepository";
import { AdminService } from "../services/adminService";
import { AdminController } from "../controllers/adminController";
import { authenticateToken } from "../middlewares/auth";
import { AdminRepository } from "../repositories/adminRepository";



const adminRouter = Router();

const usersRepo = new UsersRepository();
const adminRepo = new AdminRepository();
const adminService = new AdminService(usersRepo,adminRepo);
const adminController = new AdminController(adminService);

adminRouter.get("/admin/settings/users",authenticateToken, adminController.getUserList);

adminRouter.post("/admin/settings/users/toggle_active/:userId", authenticateToken, adminController.toggleUserActive)

export default adminRouter;
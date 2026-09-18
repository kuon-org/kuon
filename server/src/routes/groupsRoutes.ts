import { Router } from "express";
import { GroupsController } from "../controllers/groupsController.js";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";
import { GroupsRepository } from "../repositories/groupsRepository.js";
import { GroupsService } from "../services/groupsService.js";

const groupsRouter = Router();
const controller = new GroupsController(new GroupsService(new GroupsRepository()));

groupsRouter.get("/groups", controller.list);
groupsRouter.get("/groups/me", authenticateToken, controller.mine);
groupsRouter.get("/groups/:slug", optionalAuth, controller.detail);
groupsRouter.post("/groups", authenticateToken, controller.create);
groupsRouter.patch("/groups/:slug", authenticateToken, controller.update);
groupsRouter.delete("/groups/:slug", authenticateToken, controller.remove);
groupsRouter.post("/groups/:slug/members", authenticateToken, controller.addMember);
groupsRouter.delete("/groups/:slug/members/me", authenticateToken, controller.leave);
groupsRouter.patch("/groups/:slug/members/:userId", authenticateToken, controller.updateMember);
groupsRouter.delete("/groups/:slug/members/:userId", authenticateToken, controller.removeMember);

export default groupsRouter;

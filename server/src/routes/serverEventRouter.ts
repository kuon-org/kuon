import { Router } from "express";
import { serverEventController } from "../controllers/serverEventController.js";
import { requirePermission } from "../middlewares/permission.js";
import { Permissions } from "../constants/permissions.js";

const router = Router();

router.get(
  "/admin/server-events",
  requirePermission(Permissions.EventLog.Read),
  serverEventController.list,
);
router.get(
  "/admin/server-events/:eventId",
  requirePermission(Permissions.EventLog.Read),
  serverEventController.detail,
);

export default router;

import { Router } from "express";
import { NotificationController } from "../controllers/notificationController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = Router();
const controller = new NotificationController();

router.get("/notifications", authenticateToken, controller.list);
router.get("/notifications/unread-count", authenticateToken, controller.unreadCount);
router.get("/notifications/preferences", authenticateToken, controller.getPreferences);
router.put("/notifications/preferences", authenticateToken, controller.updatePreferences);
router.patch("/notifications/:notificationId/read", authenticateToken, controller.markRead);
router.patch("/notifications/read-all", authenticateToken, controller.markAllRead);
router.get("/notifications/stream", authenticateToken, controller.stream);

export default router;

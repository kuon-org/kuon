import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { TotpController } from "../controllers/totpController.js";
import { totpService } from "../services/totpService.js";

const totpRouter = Router();
const controller = new TotpController(totpService);

totpRouter.get("/users/settings/setup2fa", authenticateToken, controller.setup);
totpRouter.post(
  "/users/settings/verify2fa",
  authenticateToken,
  controller.verifySetup,
);
totpRouter.delete(
  "/users/settings/delete2fa",
  authenticateToken,
  controller.disable,
);

export default totpRouter;

import { Router } from "express";
import { IdpConfigurationRepository } from "../repositories/idpConfigurationsRepository.js";
import { IdpConfigurationsService } from "../services/idpConfigurationsService.js";
import { IdpController } from "../controllers/idpControllers.js";
import { authenticateToken } from "../middlewares/auth.js";
import { UsersRepository } from "../repositories/usersRepository.js";
const idpRouter = Router();
const idpConfRepo = new IdpConfigurationRepository();
const usersRepo = new UsersRepository();
const idpConfService = new IdpConfigurationsService(idpConfRepo, usersRepo);
const idpConfController = new IdpController(idpConfService);
idpRouter.get("/idp/active", idpConfController.getActiveIdp);
idpRouter.get("/admin/idp_list", authenticateToken, idpConfController.getAllProviders);
idpRouter.get("/admin/idp_settings/discovery", authenticateToken, idpConfController.discoverOidc); // 追加
idpRouter.get("/admin/idp_settings/:provider_name", authenticateToken, idpConfController.getIdpConf);
idpRouter.delete("/admin/idp_settings/:provider_name", authenticateToken, idpConfController.deleteIdp);
idpRouter.post("/admin/idp_settings", authenticateToken, idpConfController.upsertIdp);
idpRouter.post("/admin/idp_settings/toggle_active/:provider_name", authenticateToken, idpConfController.toggleActive);
export default idpRouter;

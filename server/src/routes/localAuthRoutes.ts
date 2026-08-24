import { Router } from "express";
import { UsersRepository } from "../repositories/usersRepository.js";
import { ArticlesRepository } from "../repositories/articlesRepository.js";
import { UsersService } from "../services/usersService.js";
import { serverSettingsService } from "../services/serverSettingsService.js";
import { LocalAuthController } from "../controllers/localAuthController.js";
import { totpService } from "../services/totpService.js";

const localAuthRouter = Router();

const usersService = new UsersService(
  new UsersRepository(),
  new ArticlesRepository(),
  serverSettingsService,
);
const controller = new LocalAuthController(usersService, totpService);

localAuthRouter.post("/login", controller.login);
localAuthRouter.post("/login/verify-2fa", controller.verify2FA);

export default localAuthRouter;

import { Router } from "express";
import { UsersRepository } from "../repositories/usersRepository.js";
import { ArticlesRepository } from "../repositories/articlesRepository.js";
import { ServerSettingsRepository } from "../repositories/serverSettingsRepository.js";
import { UsersService } from "../services/usersService.js";
import { ServerSettingsService } from "../services/serverSettingsService.js";
import { LocalAuthController } from "../controllers/localAuthController.js";

const localAuthRouter = Router();

const usersService = new UsersService(
  new UsersRepository(),
  new ArticlesRepository(),
  new ServerSettingsService(new ServerSettingsRepository()),
);
const controller = new LocalAuthController(usersService);

localAuthRouter.post("/login", controller.login);
localAuthRouter.post("/login/verify-2fa", controller.verify2FA);

export default localAuthRouter;

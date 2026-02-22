import { Router } from "express";
import { ArticlesRepository } from "../repositories/articlesRepository";
import { ArticlesService } from "../services/articlesService";
import { ShareController } from "../controllers/shareController";


const shareRouter = Router();
const articleRepo = new ArticlesRepository();
const articleService = new ArticlesService(articleRepo);
const shareCtrl = new ShareController(articleService);
shareRouter.get("/share/:articleId", shareCtrl.sharePage);

export default shareRouter;
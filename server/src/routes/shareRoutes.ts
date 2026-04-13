import { Router } from "express";
import { ArticlesRepository } from "../repositories/articlesRepository.js";
import { ArticlesService } from "../services/articlesService.js";
import { ShareController } from "../controllers/shareController.js";

const shareRouter = Router();
const articleRepo = new ArticlesRepository();
const articleService = new ArticlesService(articleRepo);
const shareCtrl = new ShareController(articleService);

/**
 * @openapi
 * /api/share/{articleId}:
 *   get:
 *     summary: 記事シェアページ (OGP用)
 *     tags:
 *       - Share
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功 (HTMLページ)
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       '404':
 *         description: 記事が見つからない
 */
shareRouter.get("/share/:articleId", shareCtrl.sharePage);

export default shareRouter;

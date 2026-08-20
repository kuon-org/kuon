import { Router } from "express";
import express from "express";
import { PlantUMLService } from "../services/plantumlService.js";
import { PlantUMLController } from "../controllers/plantumlController.js";

const pumlRouter = Router();
const pumlService = new PlantUMLService();
const pumlCtrl = new PlantUMLController(pumlService);

/**
 * @openapi
 * /api/plantuml/{format}:
 *   post:
 *     summary: PlantUML画像生成
 *     tags:
 *       - PlantUML
 *     parameters:
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [svg, png]
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             description: PlantUML diagram text
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           image/svg+xml:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       '400':
 *         description: 無効なフォーマットまたはダイアグラムなし
 *       '500':
 *         description: レンダリング失敗
 */
pumlRouter.post(
  "/plantuml/:format",
  express.text({ type: "*/*" }),
  pumlCtrl.postPlantUMLImage,
);

export default pumlRouter;

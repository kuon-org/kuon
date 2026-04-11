import { Router } from "express";
import express from "express";
import { PlantUMLService } from "../services/plantumlService.js";
import { PlantUMLController } from "../controllers/plantumlController.js";

const pumlRouter = Router();
const pumlService = new PlantUMLService();
const pumlCtrl = new PlantUMLController(pumlService);

pumlRouter.post(
  "/plantuml/:format",
  express.text({ type: "*/*" }),
  pumlCtrl.postPlantUMLImage,
);

export default pumlRouter;

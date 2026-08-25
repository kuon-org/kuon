import { Router } from "express";
import { ServerSettingKey } from "../constants/serverSettings.js";
import { serverSettingsService } from "../services/serverSettingsService.js";

const serverSettingsRouter = Router();

serverSettingsRouter.get("/server/public-settings", (_req, res) => {
  res.status(200).json({
    requireAuthentication: serverSettingsService.isEnabled(
      ServerSettingKey.RequireAuthentication,
    ),
    maintenanceMode: serverSettingsService.isEnabled(
      ServerSettingKey.MaintenanceMode,
    ),
  });
});

export default serverSettingsRouter;

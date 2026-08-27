import { Router } from "express";
import { ServerSettingKey } from "../constants/serverSettings.js";
import { runtimeMaintenanceService } from "../services/runtimeMaintenanceService.js";
import { serverSettingsService } from "../services/serverSettingsService.js";

const serverSettingsRouter = Router();

serverSettingsRouter.get("/server/public-settings", (_req, res) => {
  res.status(200).json({
    requireAuthentication: serverSettingsService.isEnabled(
      ServerSettingKey.RequireAuthentication,
    ),
    maintenanceMode:
      runtimeMaintenanceService.isLocked() ||
      serverSettingsService.isEnabled(ServerSettingKey.MaintenanceMode),
    notificationsEnabled: serverSettingsService.isEnabled(
      ServerSettingKey.NotificationsEnabled,
    ),
  });
});

export default serverSettingsRouter;

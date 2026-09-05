import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
import { AdminService } from "../services/adminService.js";
import { ServerSettingsService } from "../services/serverSettingsService.js";
import { ServerSettingKey } from "../constants/serverSettings.js";
import { emailVerificationService } from "../services/emailVerificationService.js";

export class AdminController {
  constructor(
    private adminService: AdminService,
    private serverSettingsService: ServerSettingsService,
  ) {}

  private requireUser(req: AuthRequest) {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    return req.user;
  }

  getUserList = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    try {
      res.status(200).json(await this.adminService.getUserList());
    } catch (error) {
      console.error("Admin user list fetch failed", error);
      throw new AppError(500, "ADMIN_USER_LIST_FETCH_FAILED", "Failed to fetch admin user list");
    }
  };

  toggleUserActive = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    try {
      res.status(200).json(
        await this.adminService.toggleUserActive(String(req.params.userId)),
      );
    } catch (error) {
      console.error("Admin user status update failed", error);
      throw new AppError(500, "USER_STATUS_UPDATE_FAILED", "Failed to update user status");
    }
  };

  getServerSettings = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    try {
      return res.status(200).json(await this.serverSettingsService.getAll());
    } catch (error) {
      console.error("Server settings fetch failed", error);
      throw new AppError(500, "SERVER_SETTINGS_FETCH_FAILED", "Failed to fetch server settings");
    }
  };

  updateServerSetting = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    const { key, value } = req.body as { key?: unknown; value?: unknown };
    if (typeof key !== "string" || typeof value !== "string") {
      const fields: Record<string, string[]> = {};
      if (typeof key !== "string") fields.key = ["STRING_REQUIRED"];
      if (typeof value !== "string") fields.value = ["STRING_REQUIRED"];
      throw new ValidationError(fields);
    }

    try {
      if (
        key === ServerSettingKey.EmailVerificationPolicy &&
        value === "required"
      ) {
        try {
          await emailVerificationService.prepareRequiredPolicy();
        } catch (error) {
          if (error instanceof Error && error.message === "SmtpNotConfigured") {
            throw new AppError(
              400,
              "SMTP_REQUIRED_FOR_EMAIL_VERIFICATION",
              "SMTP configuration is required for email verification",
            );
          }
          throw error;
        }
      }

      const setting = await this.serverSettingsService.set(key, value);
      return res.status(200).json(setting);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Server setting update failed", error);
      throw new AppError(500, "SERVER_SETTING_UPDATE_FAILED", "Failed to update server setting");
    }
  };
}

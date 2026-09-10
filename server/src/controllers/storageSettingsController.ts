import type { Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  storageSettingsService,
  type UpdateStorageSettingsInput,
} from "../services/storageSettingsService.js";

class StorageSettingsController {
  private requireUser(req: AuthRequest) {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    return req.user;
  }

  getSettings = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    try {
      return res.status(200).json(await storageSettingsService.getPublic());
    } catch (error) {
      console.error("Storage settings fetch failed", error);
      throw new AppError(
        500,
        "STORAGE_SETTINGS_FETCH_FAILED",
        "Failed to fetch storage settings",
      );
    }
  };

  updateSettings = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    const body = req.body as Partial<UpdateStorageSettingsInput>;
    const fields: Record<string, string[]> = {};

    if (body.provider !== "local" && body.provider !== "s3" && body.provider !== "azure") {
      fields.provider = ["INVALID_STORAGE_PROVIDER"];
    }
    if (body.deliveryMode !== "relay" && body.deliveryMode !== "redirect") {
      fields.deliveryMode = ["INVALID_STORAGE_DELIVERY_MODE"];
    }
    if (typeof body.signedUrlExpiresInSeconds !== "number") {
      fields.signedUrlExpiresInSeconds = ["NUMBER_REQUIRED"];
    }
    if (typeof body.localPath !== "string") fields.localPath = ["STRING_REQUIRED"];
    if (!body.s3 || typeof body.s3 !== "object") fields.s3 = ["OBJECT_REQUIRED"];
    if (!body.azure || typeof body.azure !== "object") fields.azure = ["OBJECT_REQUIRED"];

    if (Object.keys(fields).length > 0) throw new ValidationError(fields);

    try {
      return res.status(200).json(
        await storageSettingsService.update(body as UpdateStorageSettingsInput),
      );
    } catch (error) {
      console.error("Storage settings update failed", error);
      throw new AppError(
        400,
        "STORAGE_SETTINGS_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update storage settings",
      );
    }
  };
}

export const storageSettingsController = new StorageSettingsController();

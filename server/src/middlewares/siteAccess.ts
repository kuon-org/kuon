import type { NextFunction, Response } from "express";
import { ServerSettingKey } from "../constants/serverSettings.js";
import { serverSettingsService } from "../services/serverSettingsService.js";
import { authenticateToken, type AuthRequest } from "./auth.js";

/**
 * 匿名閲覧を許可しているエンドポイント向けのゲート。
 * require_authentication が無効な場合は従来通り通し、
 * 有効な場合のみ通常のKuon認証を要求する。
 */
export const requireSiteAuthentication = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!serverSettingsService.isEnabled(ServerSettingKey.RequireAuthentication)) {
    return next();
  }

  return authenticateToken(req, res, next);
};

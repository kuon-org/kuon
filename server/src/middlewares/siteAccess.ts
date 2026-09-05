import type { NextFunction, Response } from "express";
import { ServerSettingKey } from "../constants/serverSettings.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { serverSettingsService } from "../services/serverSettingsService.js";
import { AppError } from "../errors/AppError.js";
import {
  authenticateToken,
  optionalAuth,
  type AuthRequest,
} from "./auth.js";

const usersRepository = new UsersRepository();

const maintenanceError = () =>
  new AppError(
    503,
    "MAINTENANCE_MODE",
    "Kuon is currently under maintenance",
  );

/**
 * 通常コンテンツ向けのアクセスゲート。
 *
 * - maintenance_mode: 管理者のみ通す
 * - require_authentication: 通常のKuon認証を要求
 * - それ以外: 匿名アクセスを許可
 *
 * 認証ブートストラップと管理APIにはこのmiddlewareを適用しない。
 */
export const requireSiteAuthentication = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (serverSettingsService.isEnabled(ServerSettingKey.MaintenanceMode)) {
    return optionalAuth(req, res, async () => {
      if (!req.user) return next(maintenanceError());

      try {
        const role = await usersRepository.getUserRole(req.user.userId);
        if (role?.roles?.name !== "admin") return next(maintenanceError());
        return next();
      } catch {
        return next(maintenanceError());
      }
    });
  }

  if (!serverSettingsService.isEnabled(ServerSettingKey.RequireAuthentication)) {
    return next();
  }

  return authenticateToken(req, res, next);
};

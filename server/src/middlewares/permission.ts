import type { NextFunction, Response } from "express";
import type { PermissionKey } from "../constants/permissions.js";
import { AuthRequest, isAuthenticated } from "./auth.js";
import { permissionService } from "../services/permissionService.js";
import { AppError } from "../errors/AppError.js";

export const requirePermission = (permission: PermissionKey) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!isAuthenticated(req)) {
      return next(
        new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required"),
      );
    }

    try {
      const allowed = await permissionService.hasPermission(
        req.user.userId,
        permission,
      );
      if (!allowed) {
        return next(
          new AppError(
            403,
            "PERMISSION_DENIED",
            "Permission denied",
            { permission },
          ),
        );
      }
      next();
    } catch (error) {
      console.error("Permission check failed", error);
      return next(
        new AppError(500, "PERMISSION_CHECK_FAILED", "Permission check failed"),
      );
    }
  };
};

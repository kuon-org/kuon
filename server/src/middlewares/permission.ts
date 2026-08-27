import type { NextFunction, Response } from "express";
import type { PermissionKey } from "../constants/permissions.js";
import { AuthRequest, isAuthenticated } from "./auth.js";
import { permissionService } from "../services/permissionService.js";

export const requirePermission = (permission: PermissionKey) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    try {
      const allowed = await permissionService.hasPermission(
        req.user.userId,
        permission,
      );
      if (!allowed) {
        return res.status(403).json({
          code: "PERMISSION_DENIED",
          message: "この操作を実行する権限がありません",
          permission,
        });
      }
      next();
    } catch (error) {
      console.error("Permission check failed", error);
      return res.status(500).json({ message: "権限の確認に失敗しました" });
    }
  };
};

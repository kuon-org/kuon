import type { Response } from "express";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { permissionService } from "../services/permissionService.js";

const errorResponse = (error: unknown) => {
  const message = error instanceof Error ? error.message : "UnknownError";
  switch (message) {
    case "RoleNotFound":
      return { status: 404, message: "ロールが見つかりません" };
    case "InvalidRoleName":
      return { status: 400, message: "ロール名の形式が不正です" };
    case "BuiltinRoleCannotBeDeleted":
      return { status: 400, message: "組み込みロールは削除できません" };
    case "AdminRequiredPermissions":
      return { status: 400, message: "Adminに必須のPermissionは解除できません" };
    case "AtLeastOneRoleRequired":
      return { status: 400, message: "ユーザーには1つ以上のロールが必要です" };
    case "LastAdminCannotBeRemoved":
      return { status: 400, message: "最後のAdminユーザーからAdminロールを解除できません" };
    default:
      if (message.startsWith("UnknownPermission:")) {
        return { status: 400, message: "不明なPermissionが指定されています" };
      }
      if (message.startsWith("PermissionEscalation:")) {
        return {
          status: 403,
          message: "自分が持っていないPermissionをロールへ付与・割り当てることはできません",
        };
      }
      return { status: 500, message: "ロール設定の処理に失敗しました" };
  }
};

export class RoleController {
  getMyPermissions = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }
    try {
      const permissions = await permissionService.getUserPermissions(req.user.userId);
      return res.status(200).json({ permissions });
    } catch {
      return res.status(500).json({ message: "Permissionの取得に失敗しました" });
    }
  };

  getPermissions = async (_req: AuthRequest, res: Response) => {
    return res.status(200).json(permissionService.getPermissionCatalog());
  };

  getRoles = async (_req: AuthRequest, res: Response) => {
    try {
      return res.status(200).json(await permissionService.getRoles());
    } catch {
      return res.status(500).json({ message: "ロール一覧の取得に失敗しました" });
    }
  };

  createRole = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }
    try {
      const { name, displayName, description, permissions } = req.body ?? {};
      if (
        typeof name !== "string" ||
        typeof displayName !== "string" ||
        !Array.isArray(permissions)
      ) {
        return res.status(400).json({ message: "入力内容が不正です" });
      }
      const role = await permissionService.createRole(req.user.userId, {
        name,
        displayName,
        description: typeof description === "string" ? description : null,
        permissions,
      });
      return res.status(201).json(role);
    } catch (error) {
      const result = errorResponse(error);
      return res.status(result.status).json({ message: result.message });
    }
  };

  updateRole = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }
    try {
      const roleId = String(req.params.roleId);
      const { displayName, description, permissions } = req.body ?? {};
      if (typeof displayName !== "string" || !Array.isArray(permissions)) {
        return res.status(400).json({ message: "入力内容が不正です" });
      }
      const role = await permissionService.updateRole(req.user.userId, roleId, {
        displayName,
        description: typeof description === "string" ? description : null,
        permissions,
      });
      return res.status(200).json(role);
    } catch (error) {
      const result = errorResponse(error);
      return res.status(result.status).json({ message: result.message });
    }
  };

  deleteRole = async (req: AuthRequest, res: Response) => {
    try {
      await permissionService.deleteRole(String(req.params.roleId));
      return res.status(204).send();
    } catch (error) {
      const result = errorResponse(error);
      return res.status(result.status).json({ message: result.message });
    }
  };

  assignUserRoles = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }
    try {
      const userId = String(req.params.userId);
      const { roleIds } = req.body ?? {};
      if (!Array.isArray(roleIds) || !roleIds.every((id) => typeof id === "string")) {
        return res.status(400).json({ message: "roleIdsにはロールIDの配列を指定してください" });
      }
      const assignedRoleIds = await permissionService.assignRoles(
        req.user.userId,
        userId,
        roleIds,
      );
      return res.status(200).json({ roleIds: assignedRoleIds });
    } catch (error) {
      const result = errorResponse(error);
      return res.status(result.status).json({ message: result.message });
    }
  };
}

export const roleController = new RoleController();

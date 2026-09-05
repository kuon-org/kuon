import type { Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { permissionService } from "../services/permissionService.js";

const toRoleError = (error: unknown): AppError => {
  const message = error instanceof Error ? error.message : "UnknownError";
  switch (message) {
    case "RoleNotFound":
      return new AppError(404, "ROLE_NOT_FOUND", "Role not found");
    case "InvalidRoleName":
      return new AppError(400, "INVALID_ROLE_NAME", "Invalid role name");
    case "BuiltinRoleCannotBeDeleted":
      return new AppError(400, "BUILTIN_ROLE_CANNOT_BE_DELETED", "Built-in role cannot be deleted");
    case "AdminRequiredPermissions":
      return new AppError(400, "ADMIN_REQUIRED_PERMISSIONS", "Required admin permissions cannot be removed");
    case "AtLeastOneRoleRequired":
      return new AppError(400, "AT_LEAST_ONE_ROLE_REQUIRED", "At least one role is required");
    case "LastAdminCannotBeRemoved":
      return new AppError(400, "LAST_ADMIN_CANNOT_BE_REMOVED", "Last admin role cannot be removed");
    default:
      if (message.startsWith("UnknownPermission:")) {
        return new AppError(400, "UNKNOWN_PERMISSION", "Unknown permission");
      }
      if (message.startsWith("PermissionEscalation:")) {
        return new AppError(403, "PERMISSION_ESCALATION_DENIED", "Permission escalation denied");
      }
      console.error("Role operation failed", error);
      return new AppError(500, "ROLE_OPERATION_FAILED", "Role operation failed");
  }
};

const requireUser = (req: AuthRequest) => {
  if (!isAuthenticated(req)) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
  }
  return req.user;
};

export class RoleController {
  getMyPermissions = async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    try {
      const permissions = await permissionService.getUserPermissions(user.userId);
      return res.status(200).json({ permissions });
    } catch (error) {
      console.error("Permission fetch failed", error);
      throw new AppError(500, "PERMISSIONS_FETCH_FAILED", "Failed to fetch permissions");
    }
  };

  getPermissions = async (_req: AuthRequest, res: Response) => {
    return res.status(200).json(permissionService.getPermissionCatalog());
  };

  getRoles = async (_req: AuthRequest, res: Response) => {
    try {
      return res.status(200).json(await permissionService.getRoles());
    } catch (error) {
      console.error("Role list fetch failed", error);
      throw new AppError(500, "ROLE_LIST_FETCH_FAILED", "Failed to fetch roles");
    }
  };

  createRole = async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const { name, displayName, description, permissions } = req.body ?? {};
    const fields: Record<string, string[]> = {};
    if (typeof name !== "string") fields.name = ["STRING_REQUIRED"];
    if (typeof displayName !== "string") fields.displayName = ["STRING_REQUIRED"];
    if (!Array.isArray(permissions)) fields.permissions = ["ARRAY_REQUIRED"];
    if (Object.keys(fields).length > 0) throw new ValidationError(fields);

    try {
      const role = await permissionService.createRole(user.userId, {
        name,
        displayName,
        description: typeof description === "string" ? description : null,
        permissions,
      });
      return res.status(201).json(role);
    } catch (error) {
      throw toRoleError(error);
    }
  };

  updateRole = async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const roleId = String(req.params.roleId);
    const { displayName, description, permissions } = req.body ?? {};
    const fields: Record<string, string[]> = {};
    if (typeof displayName !== "string") fields.displayName = ["STRING_REQUIRED"];
    if (!Array.isArray(permissions)) fields.permissions = ["ARRAY_REQUIRED"];
    if (Object.keys(fields).length > 0) throw new ValidationError(fields);

    try {
      const role = await permissionService.updateRole(user.userId, roleId, {
        displayName,
        description: typeof description === "string" ? description : null,
        permissions,
      });
      return res.status(200).json(role);
    } catch (error) {
      throw toRoleError(error);
    }
  };

  deleteRole = async (req: AuthRequest, res: Response) => {
    requireUser(req);
    try {
      await permissionService.deleteRole(String(req.params.roleId));
      return res.status(204).send();
    } catch (error) {
      throw toRoleError(error);
    }
  };

  assignUserRoles = async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const userId = String(req.params.userId);
    const { roleIds } = req.body ?? {};
    if (!Array.isArray(roleIds) || !roleIds.every((id) => typeof id === "string")) {
      throw new ValidationError({ roleIds: ["STRING_ARRAY_REQUIRED"] });
    }

    try {
      const assignedRoleIds = await permissionService.assignRoles(
        user.userId,
        userId,
        roleIds,
      );
      return res.status(200).json({ roleIds: assignedRoleIds });
    } catch (error) {
      throw toRoleError(error);
    }
  };
}

export const roleController = new RoleController();

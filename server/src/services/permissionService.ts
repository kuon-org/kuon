import {
  Permissions,
  adminAccessPermissions,
  normalizePermissionDependencies,
  permissionDefinitions,
  permissionKeys,
  type PermissionKey,
} from "../constants/permissions.js";
import { PermissionRepository } from "../repositories/permissionRepository.js";

const ADMIN_REQUIRED_PERMISSIONS: readonly PermissionKey[] = [
  Permissions.User.Manage,
  Permissions.Role.Read,
  Permissions.Role.Update,
  Permissions.Role.Assign,
  Permissions.System.SettingsManage,
];

export class PermissionService {
  constructor(private repository = new PermissionRepository()) {}

  getPermissionCatalog() {
    return permissionDefinitions;
  }

  async getRoles() {
    return this.repository.getRoles();
  }

  async getUserPermissions(userId: string) {
    return this.repository.getUserPermissions(userId);
  }

  async hasPermission(userId: string, permission: PermissionKey) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  async hasAnyPermission(
    userId: string,
    permissions: readonly PermissionKey[] = adminAccessPermissions,
  ) {
    const current = new Set(await this.getUserPermissions(userId));
    return permissions.some((permission) => current.has(permission));
  }

  async createRole(input: {
    name: string;
    displayName: string;
    description?: string | null;
    permissions: string[];
  }) {
    const name = input.name.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{1,49}$/.test(name)) {
      throw new Error("InvalidRoleName");
    }
    const permissions = this.validateAndNormalize(input.permissions);
    const roleId = await this.repository.createRole({
      name,
      displayName: input.displayName.trim() || name,
      description: input.description?.trim() || null,
      permissions,
    });
    return this.repository.getRoleById(roleId);
  }

  async updateRole(
    roleId: string,
    input: {
      displayName: string;
      description?: string | null;
      permissions: string[];
    },
  ) {
    const role = await this.repository.getRoleById(roleId);
    if (!role) throw new Error("RoleNotFound");

    const permissions = this.validateAndNormalize(input.permissions);
    if (role.name === "admin") {
      const missing = ADMIN_REQUIRED_PERMISSIONS.filter(
        (permission) => !permissions.includes(permission),
      );
      if (missing.length > 0) throw new Error("AdminRequiredPermissions");
    }

    await this.repository.updateRole(roleId, {
      displayName: input.displayName.trim() || role.name,
      description: input.description?.trim() || null,
      permissions,
    });
    return this.repository.getRoleById(roleId);
  }

  async deleteRole(roleId: string) {
    const role = await this.repository.getRoleById(roleId);
    if (!role) throw new Error("RoleNotFound");
    if (role.is_builtin) throw new Error("BuiltinRoleCannotBeDeleted");

    const deleted = await this.repository.deleteRole(roleId);
    if (deleted === 0) throw new Error("RoleDeleteFailed");
  }

  async assignRoles(actorUserId: string, userId: string, roleIds: string[]) {
    const uniqueRoleIds = [...new Set(roleIds)];
    if (uniqueRoleIds.length === 0) throw new Error("AtLeastOneRoleRequired");
    if (!(await this.repository.roleIdsExist(uniqueRoleIds))) {
      throw new Error("RoleNotFound");
    }

    const adminRoleIds = await this.repository.getRoleIdsByName(["admin"]);
    const adminRoleId = adminRoleIds.get("admin");
    const currentRoleIds = await this.repository.getUserRoleIds(userId);
    const removesAdmin =
      !!adminRoleId &&
      currentRoleIds.includes(adminRoleId) &&
      !uniqueRoleIds.includes(adminRoleId);

    if (removesAdmin) {
      const adminCount = await this.repository.countUsersWithRoleName("admin");
      if (adminCount <= 1) throw new Error("LastAdminCannotBeRemoved");
    }

    await this.repository.replaceUserRoles(userId, uniqueRoleIds, actorUserId);
    return this.repository.getUserRoleIds(userId);
  }

  private validateAndNormalize(permissions: string[]): PermissionKey[] {
    const invalid = permissions.filter(
      (permission) => !permissionKeys.has(permission as PermissionKey),
    );
    if (invalid.length > 0) throw new Error(`UnknownPermission:${invalid.join(",")}`);
    return normalizePermissionDependencies(permissions as PermissionKey[]);
  }
}

export const permissionService = new PermissionService();

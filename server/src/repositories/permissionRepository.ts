import { Prisma } from "@prisma/client";
import prisma from "../prisma/client.js";
import type { PermissionKey } from "../constants/permissions.js";

export interface RoleWithPermissions {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  is_builtin: boolean;
  permissions: PermissionKey[];
}

export class PermissionRepository {
  async getUserPermissions(userId: string): Promise<PermissionKey[]> {
    const rows = await prisma.$queryRaw<{ key: PermissionKey }[]>`
      SELECT DISTINCT p.key
      FROM knowledge.user_roles ur
      JOIN knowledge.role_permissions rp ON rp.role_id = ur.role_id
      JOIN knowledge.permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ${userId}::uuid
      ORDER BY p.key
    `;
    return rows.map((row) => row.key);
  }

  async getRoles(): Promise<RoleWithPermissions[]> {
    const rows = await prisma.$queryRaw<
      Array<Omit<RoleWithPermissions, "permissions"> & { permissions: string[] }>
    >`
      SELECT
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_builtin,
        COALESCE(
          ARRAY_AGG(p.key ORDER BY p.key) FILTER (WHERE p.key IS NOT NULL),
          ARRAY[]::text[]
        ) AS permissions
      FROM knowledge.roles r
      LEFT JOIN knowledge.role_permissions rp ON rp.role_id = r.id
      LEFT JOIN knowledge.permissions p ON p.id = rp.permission_id
      GROUP BY r.id, r.name, r.display_name, r.description, r.is_builtin
      ORDER BY r.is_builtin DESC, r.name
    `;
    return rows as RoleWithPermissions[];
  }

  async getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
    const rows = await prisma.$queryRaw<
      Array<Omit<RoleWithPermissions, "permissions"> & { permissions: string[] }>
    >`
      SELECT
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_builtin,
        COALESCE(
          ARRAY_AGG(p.key ORDER BY p.key) FILTER (WHERE p.key IS NOT NULL),
          ARRAY[]::text[]
        ) AS permissions
      FROM knowledge.roles r
      LEFT JOIN knowledge.role_permissions rp ON rp.role_id = r.id
      LEFT JOIN knowledge.permissions p ON p.id = rp.permission_id
      WHERE r.id = ${roleId}::uuid
      GROUP BY r.id, r.name, r.display_name, r.description, r.is_builtin
    `;
    return (rows[0] as RoleWithPermissions | undefined) ?? null;
  }

  async createRole(input: {
    name: string;
    displayName: string;
    description?: string | null;
    permissions: PermissionKey[];
  }) {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO knowledge.roles (name, display_name, description, is_builtin)
        VALUES (${input.name}, ${input.displayName}, ${input.description ?? null}, FALSE)
        RETURNING id
      `;
      const roleId = rows[0]?.id;
      if (!roleId) throw new Error("RoleCreateFailed");
      await this.replaceRolePermissions(tx, roleId, input.permissions);
      return roleId;
    });
  }

  async updateRole(
    roleId: string,
    input: {
      displayName: string;
      description?: string | null;
      permissions: PermissionKey[];
    },
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE knowledge.roles
        SET display_name = ${input.displayName},
            description = ${input.description ?? null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${roleId}::uuid
      `;
      await this.replaceRolePermissions(tx, roleId, input.permissions);
    });
  }

  async deleteRole(roleId: string) {
    return prisma.$executeRaw`
      DELETE FROM knowledge.roles
      WHERE id = ${roleId}::uuid AND is_builtin = FALSE
    `;
  }

  async getUserRoleIds(userId: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ role_id: string }[]>`
      SELECT role_id
      FROM knowledge.user_roles
      WHERE user_id = ${userId}::uuid
    `;
    return rows.map((row) => row.role_id);
  }

  async replaceUserRoles(userId: string, roleIds: string[], assignedBy: string) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM knowledge.user_roles WHERE user_id = ${userId}::uuid
      `;
      for (const roleId of roleIds) {
        await tx.$executeRaw`
          INSERT INTO knowledge.user_roles (user_id, role_id, assigned_by)
          VALUES (${userId}::uuid, ${roleId}::uuid, ${assignedBy}::uuid)
        `;
      }
    });
  }

  async countUsersWithRoleName(roleName: string): Promise<number> {
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT ur.user_id) AS count
      FROM knowledge.user_roles ur
      JOIN knowledge.roles r ON r.id = ur.role_id
      WHERE r.name = ${roleName}
    `;
    return Number(rows[0]?.count ?? 0n);
  }

  async getRoleIdsByName(names: string[]): Promise<Map<string, string>> {
    if (names.length === 0) return new Map();
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string }>>(
      Prisma.sql`
        SELECT id, name
        FROM knowledge.roles
        WHERE name IN (${Prisma.join(names)})
      `,
    );
    return new Map(rows.map((row) => [row.name, row.id]));
  }

  async roleIdsExist(roleIds: string[]): Promise<boolean> {
    if (roleIds.length === 0) return false;
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*) AS count
        FROM knowledge.roles
        WHERE id IN (${Prisma.join(roleIds.map((id) => Prisma.sql`${id}::uuid`))})
      `,
    );
    return Number(rows[0]?.count ?? 0n) === new Set(roleIds).size;
  }

  private async replaceRolePermissions(
    tx: Prisma.TransactionClient,
    roleId: string,
    permissions: PermissionKey[],
  ) {
    await tx.$executeRaw`
      DELETE FROM knowledge.role_permissions WHERE role_id = ${roleId}::uuid
    `;
    if (permissions.length === 0) return;
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO knowledge.role_permissions (role_id, permission_id)
        SELECT ${roleId}::uuid, id
        FROM knowledge.permissions
        WHERE key IN (${Prisma.join(permissions)})
      `,
    );
  }
}

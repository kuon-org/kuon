import apiClient from "./client";

export interface PermissionDefinition {
  key: string;
  displayName: string;
  category: string;
  description: string;
  requires: readonly string[];
}

export interface RoleDefinition {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  is_builtin: boolean;
  permissions: string[];
}

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  roleId: string;
  displayName: string;
  description?: string;
  permissions: string[];
}

export const fetchMyPermissions = async () => {
  const { data } = await apiClient.get<{ permissions: string[] }>("/permissions/me");
  return data;
};

export const fetchPermissionCatalog = async () => {
  const { data } = await apiClient.get<PermissionDefinition[]>("/admin/permissions");
  return data;
};

export const fetchRoles = async () => {
  const { data } = await apiClient.get<RoleDefinition[]>("/admin/roles");
  return data;
};

export const createRole = async (input: CreateRoleInput) => {
  const { data } = await apiClient.post("/admin/roles", input);
  return data as RoleDefinition;
};

export const updateRole = async ({ roleId, ...body }: UpdateRoleInput) => {
  const { data } = await apiClient.put(`/admin/roles/${roleId}`, body);
  return data as RoleDefinition;
};

export const deleteRole = (roleId: string) => apiClient.delete(`/admin/roles/${roleId}`);

export const assignRoles = async (input: { userId: string; roleIds: string[] }) => {
  const { data } = await apiClient.put(`/admin/settings/users/${input.userId}/roles`, {
    roleIds: input.roleIds,
  });
  return data as { roleIds: string[] };
};

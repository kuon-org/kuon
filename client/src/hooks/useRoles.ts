import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

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

export const useAdminPermissions = () => {
  const query = useQuery<{ permissions: string[] }>({
    queryKey: ["myPermissions"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/permissions/me");
      return data;
    },
    staleTime: 60_000,
  });

  return {
    permissions: query.data?.permissions ?? [],
    permissions_isLoading: query.isLoading,
    permissions_isError: query.isError,
  };
};

export const useRoleManagement = (enabled = true) => {
  const queryClient = useQueryClient();

  const permissionsQuery = useQuery<PermissionDefinition[]>({
    queryKey: ["permissionCatalog"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/permissions");
      return data;
    },
    enabled,
  });

  const rolesQuery = useQuery<RoleDefinition[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/roles");
      return data;
    },
    enabled,
  });

  const createRoleMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      displayName: string;
      description?: string;
      permissions: string[];
    }) => {
      const { data } = await apiClient.post("/admin/roles", input);
      return data as RoleDefinition;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (input: {
      roleId: string;
      displayName: string;
      description?: string;
      permissions: string[];
    }) => {
      const { roleId, ...body } = input;
      const { data } = await apiClient.put(`/admin/roles/${roleId}`, body);
      return data as RoleDefinition;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roles"] }),
        queryClient.invalidateQueries({ queryKey: ["myPermissions"] }),
      ]);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await apiClient.delete(`/admin/roles/${roleId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const assignRolesMutation = useMutation({
    mutationFn: async (input: { userId: string; roleIds: string[] }) => {
      const { data } = await apiClient.put(
        `/admin/settings/users/${input.userId}/roles`,
        { roleIds: input.roleIds },
      );
      return data as { roleIds: string[] };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: ["myPermissions"] }),
      ]);
    },
  });

  return {
    permissions: permissionsQuery.data ?? [],
    roles: rolesQuery.data ?? [],
    isLoading: enabled && (permissionsQuery.isLoading || rolesQuery.isLoading),
    isError: enabled && (permissionsQuery.isError || rolesQuery.isError),
    createRole: createRoleMutation.mutateAsync,
    createRole_isPending: createRoleMutation.isPending,
    updateRole: updateRoleMutation.mutateAsync,
    updateRole_isPending: updateRoleMutation.isPending,
    deleteRole: deleteRoleMutation.mutateAsync,
    deleteRole_isPending: deleteRoleMutation.isPending,
    assignRoles: assignRolesMutation.mutateAsync,
    assignRoles_isPending: assignRolesMutation.isPending,
  };
};

import { useQuery } from "@tanstack/react-query";
import { fetchMyPermissions, fetchPermissionCatalog, fetchRoles } from "../../api/roles";
import { roleKeys } from "./keys";

export const useMyPermissionsQuery = (enabled = true) =>
  useQuery({
    queryKey: roleKeys.myPermissions,
    queryFn: fetchMyPermissions,
    staleTime: 0,
    refetchOnMount: "always",
    enabled,
  });

export const usePermissionCatalogQuery = (enabled = true) =>
  useQuery({
    queryKey: roleKeys.permissionCatalog,
    queryFn: fetchPermissionCatalog,
    enabled,
  });

export const useRolesQuery = (enabled = true) =>
  useQuery({
    queryKey: roleKeys.list(),
    queryFn: fetchRoles,
    enabled,
  });

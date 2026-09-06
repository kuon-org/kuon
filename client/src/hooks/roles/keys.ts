export const roleKeys = {
  all: ["roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
  permissionCatalog: ["permission-catalog"] as const,
  myPermissions: ["my-permissions"] as const,
};

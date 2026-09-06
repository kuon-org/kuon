import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignRoles, createRole, deleteRole, updateRole } from "../../api/roles";
import { roleKeys } from "./keys";

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRole,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roleKeys.all }),
        queryClient.invalidateQueries({ queryKey: roleKeys.myPermissions }),
      ]);
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
};

export const useAssignRoles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignRoles,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: roleKeys.myPermissions }),
      ]);
    },
  });
};

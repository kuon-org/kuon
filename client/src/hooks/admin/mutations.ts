import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cleanupIdpRegistry,
  deleteIdpConfig,
  testIdpConnectivity,
  toggleAdminUserActive,
  toggleIdpActive,
  updateIdpConfig,
  updateServerSetting,
} from "../../api/admin";
import { adminKeys } from "./keys";

export const useUpdateIdpConfig = (providerName?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateIdpConfig,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminKeys.idpConfig(providerName),
        }),
        queryClient.invalidateQueries({ queryKey: adminKeys.idps }),
      ]);
    },
  });
};

export const useToggleIdpActive = (providerName?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleIdpActive,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminKeys.idpConfig(providerName),
        }),
        queryClient.invalidateQueries({ queryKey: adminKeys.idps }),
      ]);
    },
  });
};

export const useTestIdpConnectivity = () =>
  useMutation({ mutationFn: testIdpConnectivity });

export const useCleanupIdpRegistry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cleanupIdpRegistry,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.idps }),
  });
};

export const useToggleAdminUserActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleAdminUserActive,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.users }),
  });
};

export const useDeleteIdpConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIdpConfig,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.idps }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "idps", "config"],
        }),
      ]);
    },
  });
};

export const useUpdateServerSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateServerSetting,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.serverSettings }),
        queryClient.invalidateQueries({ queryKey: ["publicServerSettings"] }),
        queryClient.invalidateQueries({
          queryKey: ["localRegistrationStatus"],
        }),
      ]);
    },
  });
};

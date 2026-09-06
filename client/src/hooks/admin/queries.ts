import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminStatus,
  fetchAdminUsers,
  fetchIdpConfig,
  fetchIdpList,
  fetchServerSettings,
} from "../../api/admin";
import { adminKeys } from "./keys";

export const useAdminUsersQuery = () =>
  useQuery({ queryKey: adminKeys.users, queryFn: fetchAdminUsers });

export const useIdpConfigQuery = (providerName?: string) =>
  useQuery({
    queryKey: adminKeys.idpConfig(providerName),
    queryFn: () => fetchIdpConfig(providerName!),
    enabled: !!providerName,
  });

export const useIdpListQuery = () =>
  useQuery({ queryKey: adminKeys.idps, queryFn: fetchIdpList });

export const useServerSettingsQuery = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.serverSettings,
    queryFn: fetchServerSettings,
    enabled,
  });

export const useAdminStatusQuery = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.status,
    queryFn: fetchAdminStatus,
    enabled,
  });

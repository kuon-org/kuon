import { useQuery } from "@tanstack/react-query";
import {
  fetchActiveIdps,
  fetchApiKeys,
  fetchAuthUser,
  fetchSessionDevices,
  fetchUploadedImages,
  fetchUserIdpInfo,
} from "../../api/auth";
import { authKeys } from "./keys";

export const useAuthUserQuery = () =>
  useQuery({
    queryKey: authKeys.user,
    queryFn: fetchAuthUser,
    retry: false,
    staleTime: Infinity,
  });

export const useUploadedImagesQuery = (enabled = true) =>
  useQuery({
    queryKey: authKeys.uploadedImages,
    queryFn: fetchUploadedImages,
    enabled,
  });

export const useActiveIdpsQuery = () =>
  useQuery({
    queryKey: authKeys.activeIdps,
    queryFn: fetchActiveIdps,
  });

export const useUserIdpInfoQuery = (enabled = true) =>
  useQuery({
    queryKey: authKeys.idpInfo,
    queryFn: fetchUserIdpInfo,
    enabled,
  });

export const useSessionDevicesQuery = (enabled = true) =>
  useQuery({
    queryKey: authKeys.devices,
    queryFn: fetchSessionDevices,
    enabled,
  });

export const useApiKeysQuery = (enabled = true) =>
  useQuery({
    queryKey: authKeys.apiKeys,
    queryFn: fetchApiKeys,
    enabled,
  });

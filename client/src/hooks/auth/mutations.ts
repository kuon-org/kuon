import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "../../api/FetchHttpClient";
import {
  createApiKey,
  delete2FA,
  login,
  logout,
  logoutAll,
  logoutSession,
  revokeApiKey,
  setup2FA,
  switchAvatar,
  unlinkIdentity,
  updateUserInfo,
  updateUsername,
  uploadLocalAvatar,
  verifyLogin2FA,
  verifySetup2FA,
} from "../../api/auth";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import i18n from "../../i18n";
import { useNotify } from "../useNotify";
import { authKeys } from "./keys";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { notify } = useNotify();
  const mutation = useMutation({
    mutationFn: login,
    onMutate: () => setServerError(null),
    onSuccess: async (data: any) => {
      if (data.requires2FA) {
        sessionStorage.setItem("pendingEmail", data.email);
      } else {
        notify(i18n.t("auth:login.success"));
        await queryClient.invalidateQueries({ queryKey: authKeys.user });
      }
    },
    onError: (apiError: ApiError) => {
      setServerError(getApiErrorMessage(apiError, i18n.t("auth:login.failed"), {
        EMAIL_VERIFICATION_REQUIRED: i18n.t("auth:login.emailVerificationRequired"),
      }));
    },
  });
  return { mutation, serverError };
};

export const useVerifyLogin2FA = () => {
  const queryClient = useQueryClient();
  const { error, success } = useNotify();
  return useMutation({
    mutationFn: verifyLogin2FA,
    onSuccess: async () => {
      success(i18n.t("auth:twoFactor.success"));
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
      sessionStorage.removeItem("pendingEmail");
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, i18n.t("auth:twoFactor.invalidCode")));
    },
  });
};

const clearAuthCache = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.setQueryData(authKeys.user, null);
  queryClient.removeQueries({ queryKey: authKeys.devices });
  queryClient.removeQueries({ queryKey: authKeys.uploadedImages });
  queryClient.removeQueries({ queryKey: authKeys.idpInfo });
  queryClient.clear();
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { success } = useNotify();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuthCache(queryClient);
      success(i18n.t("auth:logout.success"));
    },
  });
};

export const useSetup2FA = () => useMutation({ mutationFn: setup2FA });

export const useVerifySetup2FA = () => {
  const queryClient = useQueryClient();
  const { error, success } = useNotify();
  return useMutation({
    mutationFn: verifySetup2FA,
    onSuccess: async () => {
      success(i18n.t("settings:twoFactor.enabledSuccess"));
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, i18n.t("settings:twoFactor.verifyFailed")));
    },
  });
};

export const useDelete2FA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: delete2FA,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
  });
};

export const useUpdateUserInfo = () => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: ({ displayName, bio }: { displayName: string; bio: string }) => updateUserInfo(displayName, bio),
    onMutate: () => { setServerError(null); setSuccessMessage(null); },
    onSuccess: async () => {
      setSuccessMessage(i18n.t("settings:profile.updated"));
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
    onError: (apiError: ApiError) => {
      setServerError(getApiErrorMessage(apiError, i18n.t("settings:profile.updateFailed")));
    },
  });
  return { mutation, serverError, successMessage };
};

export const useUpdateUsername = () => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: ({ username }: { username: string }) => updateUsername(username),
    onMutate: () => { setServerError(null); setSuccessMessage(null); },
    onSuccess: async () => {
      setSuccessMessage(i18n.t("settings:account.usernameUpdated"));
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
    },
    onError: (apiError: ApiError) => {
      setServerError(getApiErrorMessage(apiError, i18n.t("settings:account.usernameUpdateFailed"), {
        USERNAME_ALREADY_EXISTS: i18n.t("settings:account.usernameAlreadyExists"),
        USERNAME_RESERVED: i18n.t("settings:account.usernameReserved"),
      }));
    },
  });
  return { mutation, serverError, successMessage };
};

export const useSwitchAvatar = () => {
  const queryClient = useQueryClient();
  const { error, success } = useNotify();
  return useMutation({
    mutationFn: switchAvatar,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
      await queryClient.invalidateQueries({ queryKey: authKeys.idpInfo });
      success(i18n.t("settings:account.avatarChanged"));
    },
    onError: () => error(i18n.t("settings:account.avatarChangeFailed")),
  });
};

export const useUnlinkIdentity = () => {
  const queryClient = useQueryClient();
  const { error, success } = useNotify();
  return useMutation({
    mutationFn: unlinkIdentity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
      await queryClient.invalidateQueries({ queryKey: authKeys.idpInfo });
      success(i18n.t("settings:account.unlinked"));
    },
    onError: (apiError: ApiError) => error(getApiErrorMessage(apiError, i18n.t("settings:account.unlinkFailed"))),
  });
};

export const useUploadLocalAvatar = () => {
  const queryClient = useQueryClient();
  const { error, success } = useNotify();
  return useMutation({
    mutationFn: uploadLocalAvatar,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.user });
      await queryClient.invalidateQueries({ queryKey: authKeys.idpInfo });
      success(i18n.t("settings:avatarUpload.success"));
    },
    onError: (apiError: ApiError) => {
      console.error(apiError);
      error(getApiErrorMessage(apiError, i18n.t("settings:avatarUpload.failed")));
    },
  });
};

export const useLogoutAll = () => {
  const queryClient = useQueryClient();
  const { success } = useNotify();
  return useMutation({
    mutationFn: logoutAll,
    onSuccess: () => {
      clearAuthCache(queryClient);
      success(i18n.t("auth:logout.success"));
    },
  });
};

export const useLogoutSession = () => {
  const queryClient = useQueryClient();
  const { success } = useNotify();
  return useMutation({
    mutationFn: logoutSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.devices });
      success(i18n.t("settings:security.sessionRevoked"));
    },
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  const { error, success } = useNotify();
  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.apiKeys });
      success(i18n.t("settings:apiKeys.created"));
    },
    onError: (apiError: ApiError) => error(getApiErrorMessage(apiError, i18n.t("settings:apiKeys.createFailed"))),
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();
  const { error, success } = useNotify();
  return useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.apiKeys });
      success(i18n.t("settings:apiKeys.revoked"));
    },
    onError: (apiError: ApiError) => error(getApiErrorMessage(apiError, i18n.t("settings:apiKeys.revokeFailed"))),
  });
};

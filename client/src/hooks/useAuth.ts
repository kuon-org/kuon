// src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import type { ApiError } from "../api/FetchHttpClient";
import { useState } from "react";
import authClient from "../api/authClient";
import { useNotify } from "./useNotify";
import { getApiErrorMessage } from "../utils/errorHelpers";

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: any;
  bio: any;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login_at: string;
  created_by: any;
  is_2fa_enabled: boolean;
  role: string;
}

export interface ActiveIdp {
  provider_name: string; // "twitter"
  display_name: string; // "Twitter（X）"
  provider_type: string; // "OAUTH2"
  logo_url?: string; // アイコンURL
  button_color?: string; // ボタン背景色
  text_color?: string; // ボタン文字色
}

interface UploadedImage {
  id: string;
  created_at: Date;
  user_id: string;
  category: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
}

interface UserIdpinfo {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login_at: any;
  created_by: any;
  user_identities: UserIdentity[];
  user_avatars: UserAvatar[];
}

export interface UserIdentity {
  id: string;
  provider_id: string;
  provider_uid: string;
  linked_at: string;
  identity_providers: IdentityProviders;
}

export interface IdentityProviders {
  display_name: string;
  provider_name: string;
  logo_url: string;
}

export interface UserAvatar {
  id: string;
  service_name: string;
  avatar_url: string;
  is_selected: boolean;
  updated_at: string;
}

export interface SessionDevice {
  id: string;
  created_at: Date | null;
  user_id: string;
  expires_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  device_name: string | null;
  last_used_at: Date | null;
  is_current: boolean;
}

// --- APIキー関連の型 ---
export interface UserApiKey {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreateApiKeyResponse extends UserApiKey {
  rawKey: string; // 作成時のみ返却される生キー
}

export const useAuthQuery = () => {
  const queryClient = useQueryClient();
  const { error, success, notify } = useNotify();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // ✅ 現在のログインユーザーを取得
  const authQuery = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<AuthUser>("/me");
        return data; // { id, username } など
      } catch {
        return null; // 未ログインなら null
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  // ✅ ログイン用ミューテーション
  const loginMutation = useMutation({
    mutationFn: async (value: any) => {
      const { data } = await apiClient.post("/login", value);
      return data;
    },
    onSuccess: async (data) => {
      if (data.requires2FA) {
        // 🔹 2FA入力ステップに切り替える
        sessionStorage.setItem("pendingEmail", data.email); // ← 後でverifyで使う
      } else {
        notify("ログインしました！");
        await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      }
    },
    onError: (apiError: ApiError) => {
      setServerError(
        getApiErrorMessage(apiError, "認証に失敗しました", {
          EMAIL_VERIFICATION_REQUIRED: "メールアドレスの確認が必要です",
        }),
      );
    },
  });
  const loginVerify2FA = useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      const { data } = await apiClient.post("/login/verify-2fa", {
        email,
        token,
      });
      return data; // { success: true, user }
    },
    onSuccess: async () => {
      success("二段階認証が完了しました！");
      // 認証成功後、ユーザー情報を再取得してトップへ
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      sessionStorage.removeItem("pendingEmail");
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, "認証コードが正しくありません"));
    },
  });

  // ✅ ログアウト用ミューテーション
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/logout");
    },
    onSuccess: async () => {
      await queryClient.setQueryData(["authUser"], null);
      queryClient.removeQueries({ queryKey: ["uploaded_images"] });
      queryClient.removeQueries({ queryKey: ["userAvatars"] });
      queryClient.clear();
      success("ログアウトしました");
    },
  });

  const setup2FA = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get("/users/settings/setup2fa");
      return data;
    },
  });

  const setupVerify2FA = useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post("/users/settings/verify2fa", {
        token,
      });
      return data; // { success: true, message: "二段階認証を有効化しました" }
    },
    onSuccess: async (data) => {
      success(data.message || "二段階認証を有効化しました！");
      // ログイン情報を再取得
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, "認証コードの検証に失敗しました"));
    },
  });

  const delete2FA = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete("/users/settings/delete2fa");
      return data;
    },
    onSuccess: async () => {
      // ログイン情報を再取得
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  const getUploadedImagesQuery = useQuery({
    queryKey: ["uploaded_images"],
    queryFn: async () => {
      const { data } = await apiClient.get<UploadedImage[]>(
        "/users/settings/uploaded_images",
      );
      return data;
    },
    enabled: !!authQuery.data,
  });

  const updateUserInfoMutation = useMutation({
    mutationFn: async ({
      displayName,
      bio,
    }: {
      displayName: string;
      bio: string;
    }) => {
      const { data } = await apiClient.put("/users/update/info", {
        displayName,
        bio,
      });
      return data;
    },
    onSuccess: async (data) => {
      setSuccessMessage(data.message || "プロフィールを更新しました！");
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (apiError: ApiError) => {
      setServerError(getApiErrorMessage(apiError, "プロフィールの更新に失敗しました"));
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ username }: { username: string }) => {
      const { data } = await apiClient.put("/users/update/username", {
        username,
      });
      return data;
    },
    onSuccess: async (data) => {
      setSuccessMessage(data.message || "ユーザ名を更新しました！");
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (apiError: ApiError) => {
      setServerError(
        getApiErrorMessage(apiError, "ユーザ名の更新に失敗しました", {
          USERNAME_ALREADY_EXISTS: "このユーザ名は既に使用されています",
          USERNAME_RESERVED: "このユーザ名は使用できません",
        }),
      );
    },
  });

  const getActiveIdp = useQuery({
    queryKey: ["activeIdp"],
    queryFn: async () => {
      const { data } = await apiClient.get<ActiveIdp[]>("/idp/active");
      return data;
    },
  });

  const userAvatarsQuery = useQuery({
    queryKey: ["userAvatars"],
    queryFn: async () => {
      const { data } = await apiClient.get<UserIdpinfo>(
        "/users/settings/idpinfo",
      );
      // ※ APIが { user_avatars: [...] } の形式で返す場合は data.user_avatars にしてください
      return data;
    },
    enabled: !!authQuery.data,
  });

  const switchAvatarMutation = useMutation({
    mutationFn: async (avatarId: string) => {
      const { data } = await authClient.post("/avatar/select", { avatarId });
      return data;
    },
    onSuccess: async () => {
      // ユーザー情報（ヘッダー等のアイコン）とアバター一覧を再取得
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      await queryClient.invalidateQueries({ queryKey: ["userAvatars"] });
      success("アイコンを切り替えました");
    },
    onError: () => {
      error("切り替えに失敗しました");
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (providerName: string) => {
      const { data } = await authClient.delete(`/${providerName}/unlink`);
      return data;
    },
    onSuccess: async () => {
      // ユーザー情報、アバター一覧、IDP連携情報をすべて更新
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      await queryClient.invalidateQueries({ queryKey: ["userAvatars"] });
      success("連携を解除しました");
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, "解除に失敗しました"));
    },
  });
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      await apiClient.post("/users/settings/upload_avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      await queryClient.invalidateQueries({ queryKey: ["userAvatars"] });
      success("画像をアップロードしました。ページリロードで反映されます。");
    },
    onError: (apiError: ApiError) => {
      console.error(apiError);
      error(getApiErrorMessage(apiError, "画像アップロードに失敗しました"));
    },
  });

  const getSessionDevice = useQuery<SessionDevice[]>({
    queryKey: ["device"],
    queryFn: async () => {
      const res = await apiClient.get("/devices");
      return res.data;
    },
    enabled: !!authQuery.data,
  });

  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/logout/all");
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.setQueryData(["authUser"], null);
      queryClient.removeQueries({ queryKey: ["device"] });
      queryClient.removeQueries({ queryKey: ["uploaded_images"] });
      queryClient.removeQueries({ queryKey: ["userAvatars"] });
      queryClient.clear();
      success("ログアウトしました");
    },
  });

  const logoutSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiClient.post(`/logout/device/${sessionId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device"] });
      success("無効化しました");
    },
  });

  // --- APIキー一覧の取得 ---
  const getApiKeysQuery = useQuery({
    queryKey: ["user-api-keys"],
    queryFn: async () => {
      const res = await apiClient.get<UserApiKey[]>("/users/settings/api-keys");
      return res.data;
    },
    // ログイン中のみ有効にする
    enabled: !!authQuery.data,
  });

  // --- APIキーの作成 ---
  const createApiKeyMutation = useMutation({
    mutationFn: async (data: { name: string; expiresAt: string | null }) => {
      const res = await apiClient.post<CreateApiKeyResponse>(
        "/users/settings/api-keys",
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-api-keys"] });
      success(
        "APIキーを作成しました。一度しか表示されないため、必ず控えてください。",
      );
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, "APIキーの作成に失敗しました"));
    },
  });

  // --- APIキーの削除（失効） ---
  const revokeApiKeyMutation = useMutation({
    mutationFn: async (apiKeyId: string) => {
      const res = await apiClient.delete(
        `/users/settings/api-keys/${apiKeyId}`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-api-keys"] });
      success("APIキーを失効させました");
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, "APIキーの削除に失敗しました"));
    },
  });

  return {
    user: authQuery.data,
    user_isLoading: authQuery.isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    login_isPending: loginMutation.isPending,
    logout_isPending: logoutMutation.isPending,
    setup2FA: setup2FA.mutate,
    setup2FA_isPending: setup2FA.isPending,
    setupVerify2FA: setupVerify2FA.mutate,
    setupVerify2FA_isPending: setupVerify2FA.isPending,
    delete2FA: delete2FA.mutate,
    delete2FA_isPending: delete2FA.isPending,
    loginVerify2FA: loginVerify2FA.mutate,
    loginVerify2FA_isPending: loginVerify2FA.isPending,
    uploadedImages: getUploadedImagesQuery.data,
    uploadedImages_isLoading: getUploadedImagesQuery.isLoading,
    updateUserInfo: updateUserInfoMutation.mutate,
    updateUserInfo_isPending: updateUserInfoMutation.isPending,
    updateAccount: updateAccountMutation.mutate,
    updateAccount_isPending: updateAccountMutation.isPending,
    activeIdp: getActiveIdp.data,
    activeIdp_isLoading: getActiveIdp.isLoading,
    userAvatars: userAvatarsQuery.data?.user_avatars,
    userAvatars_isLoading: userAvatarsQuery.isLoading,
    switchAvatar: switchAvatarMutation.mutate,
    switchAvatar_isPending: switchAvatarMutation.isPending,
    unlink: unlinkMutation.mutate,
    unlink_isPending: unlinkMutation.isPending,
    userIdentities: userAvatarsQuery.data?.user_identities,
    localAvatarUpload: uploadImageMutation.mutate,
    localAvatarUpload_isPending: uploadImageMutation.isPending,
    serverError,
    successMessage,

    sessionDevice: getSessionDevice.data,
    sessionDeviceIsLoading: getSessionDevice.isLoading,

    logoutAll: logoutAllMutation.mutateAsync,
    logoutAllIsPending: logoutAllMutation.isPending,

    logoutSession: logoutSessionMutation.mutateAsync,
    logoutSessionIsPending: logoutSessionMutation.isPending,

    apiKeys: getApiKeysQuery.data,
    apiKeys_isLoading: getApiKeysQuery.isLoading,
    createApiKey: createApiKeyMutation.mutateAsync, // rawKeyを受け取るためにmutateAsyncが便利
    createApiKey_isPending: createApiKeyMutation.isPending,
    revokeApiKey: revokeApiKeyMutation.mutate,
    revokeApiKey_isPending: revokeApiKeyMutation.isPending,
  };
};
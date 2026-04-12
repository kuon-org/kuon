// src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import type { HttpError } from "../api/types";
import { useState } from "react";
import authClient from "../api/authClient";
import { useNotify } from "./useNotify";

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
    onError: (error: HttpError) => {
      setServerError(error.response?.data?.message);
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
    onError: (err: HttpError) => {
      error(err.response?.data?.message || "認証コードが正しくありません");
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
    onError: (err: HttpError) => {
      error(err.response?.data?.message || "認証コードの検証に失敗しました");
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
    onError: (error: HttpError) => {
      setServerError(error.response?.data?.message);
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
    onError: (error: HttpError) => {
      setServerError(error.response?.data?.message);
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
    onError: (err: HttpError) => {
      const message =
        (err.response?.data as any)?.error || "解除に失敗しました";
      error(message);
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
    onError: (err: any) => {
      console.error(err);
      error(err.response?.data?.message ?? "画像アップロードに失敗しました");
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
  };
};

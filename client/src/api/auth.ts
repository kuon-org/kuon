import apiClient from "./client";
import authClient from "./authClient";

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login_at: string;
  created_by: string | null;
  is_2fa_enabled: boolean;
  role: string;
}

export interface ActiveIdp {
  provider_name: string;
  display_name: string;
  provider_type: string;
  logo_url?: string;
  button_color?: string;
  text_color?: string;
}

export interface UploadedImage {
  id: string;
  created_at: Date;
  user_id: string;
  category: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
}

export interface UserIdentity {
  id: string;
  provider_id: string;
  provider_uid: string;
  linked_at: string;
  identity_providers: IdentityProvider;
}

export interface IdentityProvider {
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

export interface UserIdpInfo {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login_at: string | null;
  created_by: string | null;
  user_identities: UserIdentity[];
  user_avatars: UserAvatar[];
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
  rawKey: string;
}

export const fetchAuthUser = async (): Promise<AuthUser | null> => {
  try {
    const { data } = await apiClient.get<AuthUser>("/me");
    return data;
  } catch {
    return null;
  }
};

export const login = async (value: unknown) => {
  const { data } = await apiClient.post("/login", value);
  return data;
};

export const verifyLogin2FA = async (token: string) => {
  const { data } = await apiClient.post("/login/verify-2fa", { token });
  return data;
};

export const logout = async () => {
  await apiClient.post("/logout");
};

export const setup2FA = async () => {
  const { data } = await apiClient.get("/users/settings/setup2fa");
  return data;
};

export const verifySetup2FA = async (token: string) => {
  const { data } = await apiClient.post("/users/settings/verify2fa", { token });
  return data;
};

export const delete2FA = async () => {
  const { data } = await apiClient.delete("/users/settings/delete2fa");
  return data;
};

export const fetchUploadedImages = async () => {
  const { data } = await apiClient.get<UploadedImage[]>("/users/settings/uploaded_images");
  return data;
};

export const updateUserInfo = async (displayName: string, bio: string) => {
  const { data } = await apiClient.put("/users/update/info", { displayName, bio });
  return data;
};

export const updateUsername = async (username: string) => {
  const { data } = await apiClient.put("/users/update/username", { username });
  return data;
};

export const fetchActiveIdps = async () => {
  const { data } = await apiClient.get<ActiveIdp[]>("/idp/active");
  return data;
};

export const fetchUserIdpInfo = async () => {
  const { data } = await apiClient.get<UserIdpInfo>("/users/settings/idpinfo");
  return data;
};

export const switchAvatar = async (avatarId: string) => {
  const { data } = await authClient.post("/avatar/select", { avatarId });
  return data;
};

export const unlinkIdentity = async (providerName: string) => {
  const { data } = await authClient.delete(`/${providerName}/unlink`);
  return data;
};

export const uploadLocalAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  await apiClient.post("/users/settings/upload_avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const fetchSessionDevices = async () => {
  const { data } = await apiClient.get<SessionDevice[]>("/devices");
  return data;
};

export const logoutAll = async () => {
  const { data } = await apiClient.post("/logout/all");
  return data;
};

export const logoutSession = async (sessionId: string) => {
  const { data } = await apiClient.post(`/logout/device/${sessionId}`);
  return data;
};

export const fetchApiKeys = async () => {
  const { data } = await apiClient.get<UserApiKey[]>("/users/settings/api-keys");
  return data;
};

export const createApiKey = async (payload: { name: string; expiresAt: string | null }) => {
  const { data } = await apiClient.post<CreateApiKeyResponse>("/users/settings/api-keys", payload);
  return data;
};

export const revokeApiKey = async (apiKeyId: string) => {
  const { data } = await apiClient.delete(`/users/settings/api-keys/${apiKeyId}`);
  return data;
};

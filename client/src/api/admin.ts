import apiClient from "./client";

export type AdminRole = "admin" | "moderator" | "general" | "readonly";

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login_at: unknown;
  created_by: unknown;
  role: AdminRole[];
}

export interface ServerSetting {
  key: string;
  value: string;
  updatedAt: string | null;
  source: "environment" | "database";
  readOnly: boolean;
}

export interface IdpListItem {
  provider_name: string;
  display_name: string;
  provider_type: string;
  is_active: boolean;
  source: "environment" | "database" | "registry";
  readOnly: boolean;
  configured: boolean;
  orphaned: boolean;
  userIdentityCount: number;
  canCleanup: boolean;
}

export interface IdpConnectivityResult {
  provider_name: string;
  provider_type: string;
  source: "environment" | "database";
  success: boolean;
  checks: {
    name: string;
    success: boolean;
    status?: number;
    message?: string;
  }[];
}

export interface AdminRuntimeStatus {
  uptimeSeconds: number;
  nodeVersion: string;
  environmentName: string | null;
  database: {
    status: "connected" | "error";
    postgresVersion: string | null;
  };
  environment: {
    key: string;
    configured: boolean;
    source: "environment";
  }[];
}

export const fetchAdminUsers = async () => {
  const { data } = await apiClient.get<AdminUser[]>("/admin/settings/users");
  return data;
};

export const fetchIdpConfig = async (providerName: string) => {
  const { data } = await apiClient.get(`/admin/idp_settings/${providerName}`);
  return data;
};

export const fetchIdpList = async () => {
  const { data } = await apiClient.get<IdpListItem[]>("/admin/idp_list");
  return data;
};

export const updateIdpConfig = async (values: {
  provider_name: string;
  [key: string]: unknown;
}) => {
  const { provider_name, ...rest } = values;
  const { data } = await apiClient.post("/admin/idp_settings", {
    provider_name,
    ...rest,
  });
  return data;
};

export const fetchIdpDiscovery = async (issuerHost: string) => {
  const { data } = await apiClient.get("/admin/idp_settings/discovery", {
    params: { issuer_host: issuerHost },
  });
  return data;
};

export const toggleIdpActive = (providerName: string) =>
  apiClient.post(`/admin/idp_settings/toggle_active/${providerName}`);

export const testIdpConnectivity = async (providerName: string) => {
  const { data } = await apiClient.post(
    `/admin/idp_settings/${providerName}/test`,
  );
  return data as IdpConnectivityResult;
};

export const cleanupIdpRegistry = async (providerName: string) => {
  const { data } = await apiClient.delete(
    `/admin/idp_registry/${providerName}`,
  );
  return data;
};

export const toggleAdminUserActive = (userId: string) =>
  apiClient.post(`/admin/settings/users/toggle_active/${userId}`);

export const deleteIdpConfig = (providerName: string) =>
  apiClient.delete(`/admin/idp_settings/${providerName}`);

export const fetchServerSettings = async () => {
  const { data } = await apiClient.get<ServerSetting[]>(
    "/admin/settings/server",
  );
  return data;
};

export const updateServerSetting = async (setting: {
  key: string;
  value: string;
}) => {
  const { data } = await apiClient.put("/admin/settings/server", setting);
  return data as ServerSetting;
};

export const fetchAdminStatus = async () => {
  const { data } = await apiClient.get<AdminRuntimeStatus>("/admin/status");
  return data;
};

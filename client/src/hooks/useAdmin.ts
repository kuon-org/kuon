import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "../api/client";


type Role = "admin" | "moderator" | "general" | "readonly";

interface Users {
    id: string
    username: string
    display_name: string
    email: string
    avatar_url?: string
    bio?: string
    created_at: string
    updated_at: string
    is_active: boolean
    last_login_at: any
    created_by: any
    role: Role[]
}

interface ServerSetting {
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


export const useAdminQuery = (provider_name?: string) => {
    const queryClient = useQueryClient();
    const getUsers = useQuery<Users[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/settings/users");
            return data;
        },
    })
    const getIdpConfQuery = useQuery({
        queryKey: ["idpConf", provider_name],
        queryFn: async () => {
            const { data } = await apiClient.get(`/admin/idp_settings/${provider_name}`);
            return data;
        },
        enabled: Boolean(provider_name),
    });
    const getAllIdpsQuery = useQuery({
        queryKey: ["allIdpList"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/idp_list");
            return data as IdpListItem[];
        }
    });

    const idpConfMutation = useMutation({
        mutationFn: async (values: { provider_name: string;[key: string]: any }) => {
            const { provider_name, ...rest } = values;
            const { data } = await apiClient.post(`/admin/idp_settings`, {
                provider_name,
                ...rest
            });
            return data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["idpConf", provider_name] });
            await queryClient.invalidateQueries({ queryKey: ["allIdpList"] });
        }
    });

    const fetchDiscovery = async (issuerHost: string) => {
        const { data } = await apiClient.get(`/admin/idp_settings/discovery`, {
            params: { issuer_host: issuerHost }
        });
        return data;
    };

    const idpToggleActiveMutation = useMutation({
        mutationFn: async (provider_name: string) => {
            return await apiClient.post(`/admin/idp_settings/toggle_active/${provider_name}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["idpConf", provider_name] });
            await queryClient.invalidateQueries({ queryKey: ["allIdpList"] });
        }
    })

    const idpConnectivityMutation = useMutation({
        mutationFn: async (target_name: string) => {
            const { data } = await apiClient.post(`/admin/idp_settings/${target_name}/test`);
            return data as IdpConnectivityResult;
        },
    });

    const cleanupIdpRegistryMutation = useMutation({
        mutationFn: async (target_name: string) => {
            const { data } = await apiClient.delete(`/admin/idp_registry/${target_name}`);
            return data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["allIdpList"] });
        },
    });

    const toggleUserActive = useMutation({
        mutationFn: async (userId: string) => {
            return await apiClient.post(`/admin/settings/users/toggle_active/${userId}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["users"] });
        }
    })
    const idpDeleteMutation = useMutation({
        mutationFn: async (target_name: string) => {
            return await apiClient.delete(`/admin/idp_settings/${target_name}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["allIdpList"] });
            await queryClient.invalidateQueries({ queryKey: ["idpConf"] });
        }
    });
    return {
        idpConf: getIdpConfQuery.data,
        idpConf_isLoading: getIdpConfQuery.isLoading,
        allIdps: getAllIdpsQuery.data,
        allIdps_isLoading: getAllIdpsQuery.isLoading,
        refetchIdpList: getAllIdpsQuery.refetch,
        fetchDiscovery,
        updateIdpConf: idpConfMutation.mutateAsync,
        toggleActive: idpToggleActiveMutation.mutate,
        testIdpConnectivity: idpConnectivityMutation.mutateAsync,
        testIdpConnectivity_isPending: idpConnectivityMutation.isPending,
        cleanupIdpRegistry: cleanupIdpRegistryMutation.mutateAsync,
        cleanupIdpRegistry_isPending: cleanupIdpRegistryMutation.isPending,
        users: getUsers.data,
        users_isLoading: getUsers.isLoading,
        users_isError: getUsers.isError,
        user_toggle_active: toggleUserActive.mutate,
        user_toggle_active_isPending: toggleUserActive.isPending,
        deleteIdpConf: idpDeleteMutation.mutateAsync,
        deleteIdp_isPending: idpDeleteMutation.isPending
    }
}

export const useServerSettingsQuery = (enabled = true) => {
    const queryClient = useQueryClient();
    const query = useQuery<ServerSetting[]>({
        queryKey: ["serverSettings"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/settings/server");
            return data;
        },
        enabled,
    });
    const mutation = useMutation({
        mutationFn: async (setting: { key: string; value: string }) => {
            const { data } = await apiClient.put("/admin/settings/server", setting);
            return data as ServerSetting;
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["serverSettings"] }),
                queryClient.invalidateQueries({ queryKey: ["publicServerSettings"] }),
                queryClient.invalidateQueries({ queryKey: ["localRegistrationStatus"] }),
            ]);
        },
    });

    return {
        settings: query.data,
        settings_isLoading: query.isLoading,
        updateServerSetting: mutation.mutateAsync,
        updateServerSetting_isPending: mutation.isPending,
    }
}

export const useAdminStatusQuery = (enabled = true) => {
    const query = useQuery<AdminRuntimeStatus>({
        queryKey: ["adminStatus"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/status");
            return data;
        },
        enabled,
    });

    return {
        status: query.data,
        status_isLoading: query.isLoading,
        status_isError: query.isError,
    };
}
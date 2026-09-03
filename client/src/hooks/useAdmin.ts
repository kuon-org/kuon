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
    created_at: string;
    updated_at: string;
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
        }
    });
    const getAllIdpsQuery = useQuery({
        queryKey: ["allIdpList"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/idp_list");
            return data as { provider_name: string, display_name: string, is_active: boolean }[];
        }
    });

    const idpConfMutation = useMutation({
        mutationFn: async (values: { provider_name: string;[key: string]: any }) => {
            // config だけでなく provider_name もトップレベルに置いて送信
            const { provider_name, ...rest } = values;
            const { data } = await apiClient.post(`/admin/idp_settings`, {
                provider_name,
                ...rest // ここに client_id, auth_url, mapping などが入る
            });
            return data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["idpConf", provider_name] });
        }
    });

    // 追加: Discovery 取得関数
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
        }
    })

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
            // 一覧と現在の設定キャッシュをクリア
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
        users: getUsers.data,
        users_isLoading: getUsers.isLoading,
        users_isError: getUsers.isError,
        user_toggle_active: toggleUserActive.mutate,
        user_toggle_active_isPending: toggleUserActive.isPending,
        deleteIdpConf: idpDeleteMutation.mutateAsync, // mutateAsyncにしてawaitできるようにする
        deleteIdp_isPending: idpDeleteMutation.isPending
    }
}

export const useServerSettingsQuery = () => {
    const queryClient = useQueryClient();
    const query = useQuery<ServerSetting[]>({
        queryKey: ["serverSettings"],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/settings/server");
            return data;
        },
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
    };
}

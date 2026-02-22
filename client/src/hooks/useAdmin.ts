import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "../api/client";


type Role = "admin" | "moderator"|"general" | "readonly";

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

    const idpConfMutation = useMutation({
        mutationFn: async (values: { provider_name: string; client_id: string; client_secret: string }) => {
            const { data } = await apiClient.post(`/admin/idp_settings`, values);
            return data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["idpConf", provider_name]});
        }
    });

    const idpToggleActiveMutation = useMutation({
        mutationFn: async (provider_name : string) => {
            return await apiClient.post(`/admin/idp_settings/toggle_active/${provider_name}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["idpConf", provider_name]});
        }
    })

    const toggleUserActive = useMutation({
        mutationFn: async (userId: string) => {
            return await apiClient.post(`/admin/settings/users/toggle_active/${userId}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["users"]});
        }
    })

    return {
        idpConf: getIdpConfQuery.data,
        idpConf_isLoading: getIdpConfQuery.isLoading,
        updateIdpConf: idpConfMutation.mutateAsync,
        toggleActive: idpToggleActiveMutation.mutate,
        users: getUsers.data,
        users_isLoading: getUsers.isLoading,
        users_isError: getUsers.isError,
        user_toggle_active: toggleUserActive.mutate,
        user_toggle_active_isPending: toggleUserActive.isPending
    }
}

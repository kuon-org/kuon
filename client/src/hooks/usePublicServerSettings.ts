import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export interface PublicServerSettings {
  requireAuthentication: boolean;
  maintenanceMode: boolean;
  notificationsEnabled: boolean;
}

export const usePublicServerSettings = () =>
  useQuery({
    queryKey: ["publicServerSettings"],
    queryFn: async () => {
      const { data } = await apiClient.get<PublicServerSettings>(
        "/server/public-settings",
      );
      return data;
    },
    staleTime: 60_000,
    retry: false,
  });

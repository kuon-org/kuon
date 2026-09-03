import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export interface LocalRegistrationStatus {
  localAccountRegistrationAllowed: boolean;
  initialSetup: boolean;
}

export const useLocalRegistrationStatus = () =>
  useQuery({
    queryKey: ["localRegistrationStatus"],
    queryFn: async () => {
      const { data } = await apiClient.get<LocalRegistrationStatus>(
        "/registration-status",
      );
      return data;
    },
    staleTime: 60_000,
    retry: false,
  });

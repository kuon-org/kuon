import { useQuery } from "@tanstack/react-query";
import { fetchLocalRegistrationStatus, type LocalRegistrationStatus } from "../api/public-settings";

export type { LocalRegistrationStatus } from "../api/public-settings";

export const useLocalRegistrationStatus = () =>
  useQuery<LocalRegistrationStatus>({
    queryKey: ["localRegistrationStatus"],
    queryFn: fetchLocalRegistrationStatus,
    staleTime: 60_000,
    retry: false,
  });

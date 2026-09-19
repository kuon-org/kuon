import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicServerSettings,
  type PublicServerSettings,
} from "../api/public-settings";

export type { PublicServerSettings } from "../api/public-settings";

export const usePublicServerSettings = () =>
  useQuery<PublicServerSettings>({
    queryKey: ["publicServerSettings"],
    queryFn: fetchPublicServerSettings,
    staleTime: 60_000,
    retry: false,
  });

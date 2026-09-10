import { useQuery } from "@tanstack/react-query";
import { fetchStorageSettings } from "../../api/storage";
import { storageKeys } from "./keys";

export const useStorageSettingsQuery = () =>
  useQuery({
    queryKey: storageKeys.settings(),
    queryFn: fetchStorageSettings,
  });

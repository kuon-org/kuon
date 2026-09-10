import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStorageSettings } from "../../api/storage";
import { storageKeys } from "./keys";

export const useUpdateStorageSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStorageSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: storageKeys.settings() });
    },
  });
};

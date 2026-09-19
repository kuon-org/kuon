import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendSmtpTest, updateSmtpSettings } from "../../api/smtp";
import { smtpKeys } from "./keys";

export const useUpdateSmtpSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSmtpSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: smtpKeys.settings() });
    },
  });
};

export const useSendSmtpTest = () => useMutation({ mutationFn: sendSmtpTest });

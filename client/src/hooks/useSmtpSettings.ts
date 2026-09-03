import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromAddress: string;
  fromName: string;
  passwordConfigured: boolean;
  configured: boolean;
};

export type UpdateSmtpSettingsInput = Omit<
  SmtpSettings,
  "passwordConfigured" | "configured"
> & {
  password?: string;
};

export const useSmtpSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery<SmtpSettings>({
    queryKey: ["smtpSettings"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/settings/smtp");
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateSmtpSettingsInput) => {
      const { data } = await apiClient.put("/admin/settings/smtp", input);
      return data as SmtpSettings;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["smtpSettings"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (to: string) => {
      const { data } = await apiClient.post("/admin/settings/smtp/test", { to });
      return data as { message: string };
    },
  });

  return {
    smtpSettings: query.data,
    smtpSettingsIsLoading: query.isLoading,
    updateSmtpSettings: updateMutation.mutateAsync,
    updateSmtpSettingsIsPending: updateMutation.isPending,
    sendSmtpTest: testMutation.mutateAsync,
    sendSmtpTestIsPending: testMutation.isPending,
  };
};

import apiClient from "./client";

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromAddress: string;
  fromName: string;
  passwordConfigured: boolean;
  configured: boolean;
  source: "environment" | "database";
  readOnly: boolean;
};

export type UpdateSmtpSettingsInput = Omit<
  SmtpSettings,
  "passwordConfigured" | "configured" | "source" | "readOnly"
> & {
  password?: string;
};

export const fetchSmtpSettings = async () =>
  (await apiClient.get<SmtpSettings>("/admin/settings/smtp")).data;

export const updateSmtpSettings = async (input: UpdateSmtpSettingsInput) =>
  (await apiClient.put<SmtpSettings>("/admin/settings/smtp", input)).data;

export const sendSmtpTest = async (to: string) =>
  (
    await apiClient.post<{ message: string }>("/admin/settings/smtp/test", {
      to,
    })
  ).data;

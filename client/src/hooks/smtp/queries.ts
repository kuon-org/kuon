import { useQuery } from "@tanstack/react-query";
import { fetchSmtpSettings } from "../../api/smtp";
import { smtpKeys } from "./keys";

export const useSmtpSettingsQuery = () =>
  useQuery({
    queryKey: smtpKeys.settings(),
    queryFn: fetchSmtpSettings,
  });

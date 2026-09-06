import React from "react";
import { Box, Button, Chip, Divider, Paper, Stack, Tooltip, Typography } from "@mui/material";
import Loading from "../../components/common/Loading/Loading";
import {
  useAuthUserQuery,
  useLogoutAll,
  useLogoutSession,
  useSessionDevicesQuery,
} from "../../hooks/auth";
import ComputerIcon from "@mui/icons-material/Computer";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import { useTranslation } from "react-i18next";

const getDeviceIcon = (ua: string | null) => {
  if (!ua) return <ComputerIcon />;
  const lower = ua.toLowerCase();
  if (lower.includes("iphone") || lower.includes("android") || lower.includes("mobile")) return <SmartphoneIcon fontSize="small" />;
  return <ComputerIcon fontSize="small" />;
};

export const Security = () => {
  const { t, i18n } = useTranslation("settings");
  const authUserQuery = useAuthUserQuery();
  const sessionDevicesQuery = useSessionDevicesQuery(!!authUserQuery.data);
  const logoutAll = useLogoutAll();
  const logoutSession = useLogoutSession();
  if (sessionDevicesQuery.isLoading) return <Loading />;
  const formatDate = (value: string | Date) => new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
  const sorted = [...(sessionDevicesQuery.data ?? [])].sort((a, b) => new Date(b.last_used_at ?? 0).getTime() - new Date(a.last_used_at ?? 0).getTime());

  return (
    <Paper sx={{ mx: "auto", flex: 1, p: 3, minWidth: { md: "600px", lg: "850px" } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">{t("security.title")}</Typography>
        <Button variant="outlined" color="error" onClick={() => logoutAll.mutate()} disabled={logoutAll.isPending}>{t("security.logoutAll")}</Button>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={2}>
        {sorted.map((sd) => (
          <Paper key={sd.id} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", color: "text.disabled", flexShrink: 0 }}>
                {React.cloneElement(getDeviceIcon(sd.user_agent), { sx: { fontSize: 50 }, fontSize: "inherit" })}
              </Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexGrow: 1 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography fontWeight="bold">{sd.device_name ?? t("security.unknownDevice")}</Typography>
                    {sd.is_current && <Chip label={t("security.currentSession")} color="primary" size="small" />}
                  </Stack>
                  {sd.ip_address && <Typography variant="body2" color="text.secondary">IP: {sd.ip_address}</Typography>}
                  {sd.created_at && <Typography variant="body2" color="text.secondary">{t("security.createdAt", { date: formatDate(sd.created_at) })}</Typography>}
                  {sd.last_used_at && <Typography variant="body2" color="text.secondary">{t("security.lastUsedAt", { date: formatDate(sd.last_used_at) })}</Typography>}
                </Box>
                <Tooltip title={sd.is_current ? t("security.currentSessionCannotRevoke") : ""} placement="top" arrow>
                  <span><Button variant="outlined" color="error" size="small" disabled={logoutSession.isPending || sd.is_current} onClick={() => logoutSession.mutate(sd.id)} sx={{ ml: 2, flexShrink: 0 }}>{t("security.revoke")}</Button></span>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
};

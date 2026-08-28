import { Box, Container, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  adminBackupRestoreRoute,
  adminRoleManagementRoute,
  adminRoute,
  adminSecurityRoute,
  adminServerEventsRoute,
  adminServerSettingsRoute,
  adminTopRoute,
  adminUserManagementRoute,
  adminWebhooksRoute,
} from "../../routes";
import { useAuthQuery } from "../../hooks/useAuth";
import { useAdminPermissions } from "../../hooks/useRoles";
import { KuonLogo } from "../../components/Logo/Kuon";
import Loading from "../../components/common/Loading/Loading";

export const AdminIndex = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthQuery();
  const { permissions, permissions_isLoading } = useAdminPermissions();
  const can = (permission: string) => permissions.includes(permission);

  const routes = [
    { path: adminRoute.to, label: "管理TOP", visible: true },
    { path: adminTopRoute.to, label: "アプリ設定", visible: can("system.settings.manage") },
    { path: adminSecurityRoute.to, label: "セキュリティ設定", visible: can("system.idp.manage") || can("system.settings.manage") },
    { path: adminServerSettingsRoute.to, label: "サーバ設定", visible: can("system.settings.manage") },
    { path: adminWebhooksRoute.to, label: "Webhooks", visible: can("system.webhook.manage") },
    { path: adminBackupRestoreRoute.to, label: "Backup & Restore", visible: can("system.backup.execute") },
    { path: adminServerEventsRoute.to, label: "Server Events", visible: can("eventlog.read") },
    { path: adminUserManagementRoute.to, label: "ユーザ管理", visible: can("user.read") },
    { path: adminRoleManagementRoute.to, label: "ロールと権限", visible: can("role.read") },
  ].filter((route) => route.visible);

  const selectedLabel = routes.find((r) => r.path === location.pathname)?.label;
  const hasAdminAccess = permissions.some(
    (permission) =>
      permission.startsWith("system.") ||
      permission.startsWith("user.") ||
      permission.startsWith("role.") ||
      permission === "eventlog.read",
  );

  if (!user || permissions_isLoading) return <Loading />;
  if (!hasAdminAccess) return <Navigate to="/" />;

  return (
    <Box>
      <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
        <Box sx={{ display: "flex" }}>
          <KuonLogo size={48} variant="accent" />
          <Typography variant="h4" ml={1}>
            {selectedLabel ? `${selectedLabel} - KUON` : "KUON"}
          </Typography>
        </Box>
      </Link>
      <Container
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 4, md: 12 },
          alignItems: { xs: "center", md: "flex-start" },
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", sm: "360px" },
            minWidth: { xs: "100%", sm: "360px" },
            minHeight: "400px",
            display: "flex",
            flexDirection: "column",
            p: 2,
          }}
        >
          <List>
            {routes.map((r) => (
              <ListItemButton
                key={r.path}
                onClick={() => navigate({ to: r.path })}
                selected={location.pathname === r.path}
              >
                <ListItemText>{r.label}</ListItemText>
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Outlet />
      </Container>
    </Box>
  );
};

import {
  Box,
  Container,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Typography,
} from "@mui/material";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  adminBackupRestoreRoute,
  adminRoleManagementRoute,
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

interface AdminNavItem {
  path: string;
  label: string;
  visible: boolean;
}

interface AdminNavSection {
  label?: string;
  items: AdminNavItem[];
}

export const AdminIndex = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthQuery();
  const { permissions, permissions_isLoading } = useAdminPermissions();
  const can = (permission: string) => permissions.includes(permission);

  const sections: AdminNavSection[] = [
    {
      items: [{ path: adminTopRoute.to, label: "管理トップ", visible: true }],
    },
    {
      label: "設定",
      items: [
        { path: adminServerSettingsRoute.to, label: "アプリ設定", visible: can("system.settings.manage") },
      ],
    },
    {
      label: "認証・セキュリティ",
      items: [
        {
          path: adminSecurityRoute.to,
          label: "ID / Password・Identity Providers",
          visible: can("system.idp.manage") || can("system.settings.manage"),
        },
      ],
    },
    {
      label: "ユーザー・権限",
      items: [
        { path: adminUserManagementRoute.to, label: "ユーザー", visible: can("user.read") },
        { path: adminRoleManagementRoute.to, label: "ロールと権限", visible: can("role.read") },
      ],
    },
    {
      label: "連携",
      items: [
        { path: adminWebhooksRoute.to, label: "Webhooks", visible: can("system.webhook.manage") },
      ],
    },
    {
      label: "運用",
      items: [
        { path: adminBackupRestoreRoute.to, label: "Backup & Restore", visible: can("system.backup.execute") },
        { path: adminServerEventsRoute.to, label: "Server Events", visible: can("eventlog.read") },
      ],
    },
  ]
    .map((section) => ({ ...section, items: section.items.filter((item) => item.visible) }))
    .filter((section) => section.items.length > 0);

  const routes = sections.flatMap((section) => section.items);
  const selectedLabel = routes.find((route) => route.path === location.pathname)?.label;
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <KuonLogo size={48} variant="accent" />
          <Typography variant="h4" ml={1}>
            {selectedLabel ? `${selectedLabel} - KUON` : "KUON Admin"}
          </Typography>
        </Box>
      </Link>
      <Container
        maxWidth="xl"
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 3, md: 6 },
          alignItems: { xs: "stretch", md: "flex-start" },
        }}
      >
        <Box
          component="nav"
          sx={{
            width: { xs: "100%", md: 300 },
            minWidth: { md: 300 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <List disablePadding>
            {sections.map((section, sectionIndex) => (
              <Box key={section.label ?? "top"} sx={{ mb: sectionIndex === sections.length - 1 ? 0 : 1.5 }}>
                {section.label && (
                  <ListSubheader
                    disableSticky
                    sx={{
                      bgcolor: "transparent",
                      color: "text.secondary",
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 2.5,
                      px: 2,
                    }}
                  >
                    {section.label}
                  </ListSubheader>
                )}
                {section.items.map((route) => (
                  <ListItemButton
                    key={route.path}
                    onClick={() => navigate({ to: route.path })}
                    selected={location.pathname === route.path}
                    sx={{ borderRadius: 1.5, mb: 0.5 }}
                  >
                    <ListItemText primary={route.label} />
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Container>
    </Box>
  );
};

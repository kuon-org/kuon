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
import { useTranslation } from "react-i18next";
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
import { useAuthUserQuery } from "../../hooks/auth";
import { useMyPermissionsQuery } from "../../hooks/roles";
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
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const location = useLocation();
  const authUserQuery = useAuthUserQuery();
  const user = authUserQuery.data;
  const permissionsQuery = useMyPermissionsQuery(!!user);
  const permissions = permissionsQuery.data?.permissions ?? [];
  const can = (permission: string) => permissions.includes(permission);

  const sections: AdminNavSection[] = [
    {
      items: [{ path: adminTopRoute.to, label: t("dashboard.title"), visible: true }],
    },
    {
      label: t("serverSettings.title"),
      items: [
        { path: adminServerSettingsRoute.to, label: t("serverSettings.title"), visible: can("system.settings.manage") },
      ],
    },
    {
      label: t("security.title"),
      items: [
        {
          path: adminSecurityRoute.to,
          label: t("security.identityProviders"),
          visible: can("system.idp.manage") || can("system.settings.manage"),
        },
      ],
    },
    {
      label: t("users.title"),
      items: [
        { path: adminUserManagementRoute.to, label: t("users.title"), visible: can("user.read") },
        { path: adminRoleManagementRoute.to, label: t("roles.title"), visible: can("role.read") },
      ],
    },
    {
      label: t("webhooks.title"),
      items: [
        { path: adminWebhooksRoute.to, label: t("webhooks.title"), visible: can("system.webhook.manage") },
      ],
    },
    {
      label: t("serverEvents.title"),
      items: [
        { path: adminBackupRestoreRoute.to, label: t("backup.title"), visible: can("system.backup.execute") },
        { path: adminServerEventsRoute.to, label: t("serverEvents.title"), visible: can("eventlog.read") },
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

  if (!user || permissionsQuery.isLoading) return <Loading />;
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

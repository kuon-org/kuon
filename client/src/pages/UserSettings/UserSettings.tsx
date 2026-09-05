import { Box, Container, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { accountSettingRoute, apiKeySettingsRoute, passwordSettingRoute, publicProfileRoute, securityRoute, uploadedImagesRoute, user2faSettingRoute, userNotificationsRoute, userWebhooksRoute } from "../../routes";
import { useTranslation } from "react-i18next";

export const UserSettings = () => {
  const { t } = useTranslation("settings");
  const navigate = useNavigate();
  const location = useLocation();
  const isSelected = (path: string) => location.pathname === path;
  const items = [
    [accountSettingRoute.to, "menu.account"],
    [publicProfileRoute.to, "menu.profile"],
    [userNotificationsRoute.to, "menu.notifications"],
    [securityRoute.to, "menu.security"],
    [passwordSettingRoute.to, "menu.password"],
    [user2faSettingRoute.to, "menu.twoFactor"],
    [apiKeySettingsRoute.to, "menu.apiKeys"],
    [userWebhooksRoute.to, "menu.webhooks"],
    [uploadedImagesRoute.to, "menu.uploads"],
  ] as const;

  return (
    <Container sx={{ mt: 2, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 4, md: 12 }, alignItems: { xs: "center", md: "flex-start" } }}>
      <Box sx={{ width: { xs: "100%", sm: "360px" }, minWidth: { xs: "100%", sm: "360px" }, minHeight: "400px", display: "flex", flexDirection: "column", p: 2, mx: "auto" }}>
        <Typography variant="subtitle1" mb={2}>{t("title")}</Typography>
        <List>
          {items.map(([to, key]) => (
            <ListItemButton key={to} onClick={() => navigate({ to })} selected={isSelected(to)}>
              <ListItemText>{t(key)}</ListItemText>
            </ListItemButton>
          ))}
        </List>
      </Box>
      <Outlet />
    </Container>
  );
};

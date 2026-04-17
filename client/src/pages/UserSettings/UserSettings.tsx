import {
  Box,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  accountSettingRoute,
  apiKeySettingsRoute,
  publicProfileRoute,
  securityRoute,
  uploadedImagesRoute,
  user2faSettingRoute,
} from "../../routes";
export const UserSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSelected = (path: string) => location.pathname === path;

  return (
    <Container
      sx={{
        mt: 2,
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
          mx: "auto",
        }}
      >
        <Typography variant="subtitle1" mb={2}>
          設定
        </Typography>
        <List>
          <ListItemButton
            onClick={() => navigate({ to: accountSettingRoute.to })}
            selected={isSelected(accountSettingRoute.to)}
          >
            <ListItemText>アカウント</ListItemText>
          </ListItemButton>
          <ListItemButton
            onClick={() => navigate({ to: publicProfileRoute.to })}
            selected={isSelected(publicProfileRoute.to)}
          >
            <ListItemText>公開用プロフィール</ListItemText>
          </ListItemButton>
          <ListItemButton
            onClick={() => navigate({ to: securityRoute.to })}
            selected={isSelected(securityRoute.to)}
          >
            <ListItemText>セキュリティ</ListItemText>
          </ListItemButton>
          <ListItemButton
            onClick={() => navigate({ to: user2faSettingRoute.to })}
            selected={isSelected(user2faSettingRoute.to)}
          >
            <ListItemText>二段階認証</ListItemText>
          </ListItemButton>
          <ListItemButton
            onClick={() => navigate({ to: apiKeySettingsRoute.to })}
            selected={isSelected(apiKeySettingsRoute.to)}
          >
            <ListItemText>APIキー設定</ListItemText>
          </ListItemButton>
          <ListItemButton
            onClick={() => navigate({ to: uploadedImagesRoute.to })}
            selected={isSelected(uploadedImagesRoute.to)}
          >
            <ListItemText>アップロードしたファイル</ListItemText>
          </ListItemButton>
        </List>
      </Box>
      <Outlet />
    </Container>
  );
};

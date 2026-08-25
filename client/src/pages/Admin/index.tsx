import {
  Box,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  adminBackupRestoreRoute,
  adminRoute,
  adminSecurityRoute,
  adminServerSettingsRoute,
  adminTopRoute,
  adminUserManagementRoute,
} from "../../routes";
import { useAuthQuery } from "../../hooks/useAuth";
import { KuonLogo } from "../../components/Logo/Kuon";
export const AdminIndex = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthQuery();
  // ルートと表示テキストをまとめたリスト
  const isAdmin = user?.role === "admin" ? true : false;
  const routes = [
    { path: adminRoute.to, label: "管理TOP" },
    { path: adminTopRoute.to, label: "アプリ設定" },
    { path: adminSecurityRoute.to, label: "セキュリティ設定" },
    { path: adminServerSettingsRoute.to, label: "サーバ設定" },
    { path: adminBackupRestoreRoute.to, label: "Backup & Restore" },
    { path: adminUserManagementRoute.to, label: "ユーザ管理" },
    // ここにどんどん追加可能
  ];

  // 選択中のテキストを取得
  const selectedLabel = routes.find((r) => r.path === location.pathname)?.label;
  if (!isAdmin) return <Navigate to="/" />;
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

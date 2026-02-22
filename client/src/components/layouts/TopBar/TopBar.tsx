import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import { useAuthQuery } from "../../../hooks/useAuth";
import { NavButton } from "../../common/NavButton";
import EditIcon from "@mui/icons-material/Edit";
import { UserIcon } from "./UserIcon";
import SettingsIcon from "@mui/icons-material/Settings";
import { Link } from "@tanstack/react-router";
import { adminRoute } from "../../../router";
const TopBar = () => {
  const { user } = useAuthQuery();
  const isAdmin = user?.role === "admin" ? true : false;

  return (
    <AppBar position="static" color="primary" sx={{ height: "56px" }}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* ロゴマーク：ここでは仮にSVGやIcon */}
          {/* <LogoIcon sx={{
            fontSize: 32,
            color: mode === 'dark' ? '#FFCA28' : '#181B26'
          }} /> */}

          {/* ロゴタイプ：フォントは少しウェイトを重めに */}
          <Typography variant="h6" sx={{
            fontWeight: 700,
            letterSpacing: '0.1rem',
            color: 'primary.contrastText'
          }}>
            KUON
          </Typography>
        </Box>

        {/* 右側：ユーザー情報＋ボタン群 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {isAdmin && (
            <>
            <Link
              to={adminRoute.to}
              style={{ textDecoration: "none", color: "inherit"}}
            >
              <SettingsIcon />
            </Link>
             
            </>
          )}
          {user ? (
            <>
              <UserIcon />
              <NavButton
                path="/drafts/new"
                message="記事を作成"
                Icon={<EditIcon />}
              />
            </>
          ) : (
            <>
              <NavButton
                path="/login"
                message="ログイン"
                variant="outlined"
              />
              <NavButton
                path="/register"
                message="アカウント登録"
                variant="contained"
              />
            </>

          )}
          
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;

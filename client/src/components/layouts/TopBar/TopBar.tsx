import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  InputBase,
} from "@mui/material";
import { useAuthQuery } from "../../../hooks/useAuth";
import { NavButton } from "../../common/NavButton";
import EditIcon from "@mui/icons-material/Edit";
import { UserIcon } from "./UserIcon";
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import { Link, useNavigate } from "@tanstack/react-router";
import { adminRoute } from "../../../router";
import { useState } from "react";
const TopBar = () => {
  const { user } = useAuthQuery();
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    // 検索ページへ遷移
    navigate({ to: "/search", search: { q: searchValue, page: 1 } });
    setSearchValue(""); // 入力欄をクリア
  };
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* ロゴマーク：ここでは仮にSVGやIcon */}
          {/* <LogoIcon sx={{
            fontSize: 32,
            color: mode === 'dark' ? '#FFCA28' : '#181B26'
          }} /> */}

          {/* ロゴタイプ：フォントは少しウェイトを重めに */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.1rem",
              color: "primary.contrastText",
            }}
          >
            KUON
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", mx: 4 }}>
          <Paper
            component="form"
            onSubmit={handleSearch}
            sx={{
              p: "2px 8px",
              display: "flex",
              alignItems: "center",
              width: "100%",
              maxWidth: "400px",
              bgcolor: "rgba(255, 255, 255, 0.15)",
              boxShadow: "none",
              borderRadius: "4px",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
            }}
          >
            <SearchIcon
              sx={{ color: "primary.contrastText", opacity: 0.7, fontSize: 20 }}
            />
            <InputBase
              sx={{
                ml: 1,
                flex: 1,
                color: "primary.contrastText",
                fontSize: "0.875rem",
              }}
              placeholder="キーワードを入力"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </Paper>
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
                style={{ textDecoration: "none", color: "inherit" }}
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
              <NavButton path="/login" message="ログイン" variant="outlined" />
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

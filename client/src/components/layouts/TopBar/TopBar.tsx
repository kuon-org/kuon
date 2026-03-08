import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  InputBase,
  useTheme,
  useMediaQuery,
  IconButton,
  Fade,
  Avatar,
} from "@mui/material";
import { useAuthQuery } from "../../../hooks/useAuth";
import { NavButton } from "../../common/NavButton";
import EditIcon from "@mui/icons-material/Edit";
import { UserIcon } from "./UserIcon";
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { Link, useNavigate } from "@tanstack/react-router";
import { adminRoute } from "../../../router";
import { useState } from "react";
import { KuonLogo } from "../../Logo/Kuon";

const TopBar = () => {
  const { user } = useAuthQuery();
  const [searchValue, setSearchValue] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate({ to: "/search", search: { q: searchValue, page: 1 } });
    setSearchValue("");
    setShowSearch(false);
  };

  const isAdmin = user?.role === "admin";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar position="static" color="primary" sx={{ p: 1 }}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: isMobile ? 1 : 3,
        }}
      >
        {/* 左側：ロゴ */}
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <KuonLogo size={32} variant="accent" />
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
        </Link>
        {/* 中央：検索アイコンまたは検索バー */}
        {isMobile ? (
          <IconButton
            onClick={() => setShowSearch((prev) => !prev)}
            sx={{ color: "primary.contrastText" }}
          >
            {showSearch ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
        ) : (
          <Box
            sx={{ flex: 1, display: "flex", justifyContent: "center", mx: 4 }}
          >
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
                sx={{
                  color: "primary.contrastText",
                  opacity: 0.7,
                  fontSize: 20,
                }}
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
        )}

        {/* 右側：ボタン群 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isAdmin && (
            <Link
              to={adminRoute.to}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <SettingsIcon />
            </Link>
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

      {/* スマホ用：下にフル幅の検索バーを展開 */}
      {isMobile && (
        <Fade in={showSearch}>
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              width: "100%",
              bgcolor: "primary.main",
              px: 2,
              py: 1,
              display: showSearch ? "flex" : "none",
              alignItems: "center",
              gap: 1,
            }}
          >
            <SearchIcon sx={{ color: "white", opacity: 0.7, fontSize: 20 }} />
            <InputBase
              autoFocus
              fullWidth
              placeholder="キーワードを入力"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={{
                color: "white",
                fontSize: "0.9rem",
              }}
            />
          </Box>
        </Fade>
      )}
    </AppBar>
  );
};

export default TopBar;

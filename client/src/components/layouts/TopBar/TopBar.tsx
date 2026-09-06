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
} from "@mui/material";
import { useAuthUserQuery } from "../../../hooks/auth";
import { useMyPermissionsQuery } from "../../../hooks/roles";
import { usePublicServerSettings } from "../../../hooks/usePublicServerSettings";
import { NavButton } from "../../common/NavButton";
import EditIcon from "@mui/icons-material/Edit";
import { UserIcon } from "./UserIcon";
import { NotificationBell } from "./NotificationBell";
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { Link, useNavigate } from "@tanstack/react-router";
import { adminRoute } from "../../../routes";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { KuonLogo } from "../../Logo/Kuon";

const TopBar = () => {
  const { t } = useTranslation("common");
  const authUserQuery = useAuthUserQuery();
  const user = authUserQuery.data;
  const permissionsQuery = useMyPermissionsQuery(!!user);
  const permissions = permissionsQuery.data?.permissions ?? [];
  const { data: publicSettings } = usePublicServerSettings();
  const [searchValue, setSearchValue] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate({ to: "/search", search: { q: searchValue, page: 1 } });
    setSearchValue("");
    setShowSearch(false);
  };

  const hasAdminAccess = permissions.some(
    (permission) =>
      permission.startsWith("system.") ||
      permission.startsWith("user.") ||
      permission.startsWith("role.") ||
      permission === "eventlog.read",
  );
  const canCreateArticle = permissions.includes("article.create");
  const notificationsEnabled = publicSettings?.notificationsEnabled ?? true;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar position="static" color="primary" sx={{ p: 1 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: isMobile ? 1 : 3 }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <KuonLogo size={32} variant="accent" />
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "0.1rem", color: "primary.contrastText" }}>KUON</Typography>
          </Box>
        </Link>

        {isMobile ? (
          <IconButton onClick={() => setShowSearch((prev) => !prev)} sx={{ color: "primary.contrastText" }} aria-label={t("search.placeholder")}>
            {showSearch ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
        ) : (
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center", mx: 4 }}>
            <Paper component="form" onSubmit={handleSearch} sx={{ p: "2px 8px", display: "flex", alignItems: "center", width: "100%", maxWidth: "400px", bgcolor: "rgba(255, 255, 255, 0.15)", boxShadow: "none", borderRadius: "4px", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" } }}>
              <SearchIcon sx={{ color: "primary.contrastText", opacity: 0.7, fontSize: 20 }} />
              <InputBase sx={{ ml: 1, flex: 1, color: "primary.contrastText", fontSize: "0.875rem" }} placeholder={t("search.placeholder")} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
            </Paper>
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {user && <NotificationBell enabled={notificationsEnabled} />}
          {hasAdminAccess && <Link to={adminRoute.to} style={{ textDecoration: "none", color: "inherit" }}><SettingsIcon /></Link>}
          {user ? (
            <>
              <UserIcon />
              {canCreateArticle && <NavButton path="/drafts/new" message={t("article.create")} Icon={<EditIcon />} variant="contained" color="secondary" />}
            </>
          ) : (
            <>
              <NavButton path="/login" message={t("account.login")} variant="outlined" color="inherit" />
              <NavButton path="/register" message={t("account.register")} variant="contained" color="secondary" />
            </>
          )}
        </Box>
      </Toolbar>

      {isMobile && (
        <Fade in={showSearch}>
          <Box component="form" onSubmit={handleSearch} sx={{ width: "100%", bgcolor: "primary.main", px: 2, py: 1, display: showSearch ? "flex" : "none", alignItems: "center", gap: 1 }}>
            <SearchIcon sx={{ color: "white", opacity: 0.7, fontSize: 20 }} />
            <InputBase autoFocus fullWidth placeholder={t("search.placeholder")} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} sx={{ color: "white", fontSize: "0.9rem" }} />
          </Box>
        </Fade>
      )}
    </AppBar>
  );
};

export default TopBar;

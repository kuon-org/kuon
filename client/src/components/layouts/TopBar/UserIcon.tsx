import { useState } from "react";
import { useAuthUserQuery, useLogout } from "../../../hooks/auth";
import {
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Box,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import EditNoteIcon from "@mui/icons-material/EditNote";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import SettingsIcon from "@mui/icons-material/Settings";
import InventoryIcon from "@mui/icons-material/Inventory";
import LanguageIcon from "@mui/icons-material/Language";
import { useNavigate } from "@tanstack/react-router";
import { ThemeSelect } from "../../common/ThemeSelect";
import { LanguageSelect } from "../../common/LanguageSelect";
import ContrastIcon from "@mui/icons-material/Contrast";
import DeleteIcon from "@mui/icons-material/Delete";
import styled from "@emotion/styled";
import { stocksRoute } from "../../../routes";
import { useTranslation } from "react-i18next";

const StyledListHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  fontWeight: "bold",
  padding: "8px 16px",
  cursor: "pointer",
});

type MenuView = "main" | "theme" | "language";

export const UserIcon = () => {
  const { t } = useTranslation("common");
  const authUserQuery = useAuthUserQuery();
  const logout = useLogout();
  const user = authUserQuery.data;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuView, setMenuView] = useState<MenuView>("main");
  const navigate = useNavigate();

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuView("main");
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        navigate({ to: "/" });
      },
    });
    handleCloseMenu();
  };

  const handleMyPage = () => {
    if (user?.username) {
      navigate({ to: "/$username", params: { username: user.username } });
    } else {
      navigate({ to: "/login" });
    }
    handleCloseMenu();
  };

  const handleDrafts = () => {
    navigate({ to: "/drafts" });
    handleCloseMenu();
  };
  const handleStocks = () => {
    navigate({ to: stocksRoute.to, search: { page: 1, q: undefined } });
    handleCloseMenu();
  };
  const handleSettings = () => {
    navigate({ to: "/settings" });
    handleCloseMenu();
  };

  const handleTrash = () => {
    navigate({ to: "/trash" });
    handleCloseMenu();
  };

  return (
    <>
      <IconButton onClick={handleOpenMenu} sx={{ p: 0 }}>
        <Avatar
          src={user?.avatar_url ?? undefined}
          alt={user?.display_name}
          sx={{ width: 32, height: 32, bgcolor: "grey.200" }}
        />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{ paper: { sx: { width: 280 } } }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {menuView === "main" ? (
          <Box>
            <MenuItem onClick={handleMyPage}>
              <PersonIcon sx={{ mr: 1 }} />
              {t("userMenu.myPage")}
            </MenuItem>
            <MenuItem onClick={handleStocks}>
              <InventoryIcon sx={{ mr: 1 }} />
              {t("userMenu.stocks")}
            </MenuItem>
            <MenuItem onClick={() => setMenuView("theme")}>
              <ContrastIcon sx={{ mr: 1 }} />
              {t("userMenu.theme")}
            </MenuItem>
            <MenuItem onClick={() => setMenuView("language")}>
              <LanguageIcon sx={{ mr: 1 }} />
              {t("userMenu.language")}
            </MenuItem>

            <Divider />
            <MenuItem onClick={handleDrafts}>
              <EditNoteIcon sx={{ mr: 1 }} />
              {t("userMenu.drafts")}
            </MenuItem>
            <MenuItem onClick={handleTrash}>
              <DeleteIcon sx={{ mr: 1 }} />
              {t("userMenu.trash")}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSettings}>
              <SettingsIcon sx={{ mr: 1 }} />
              {t("userMenu.settings")}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              {logout.isPending
                ? t("userMenu.loggingOut")
                : t("userMenu.logout")}
            </MenuItem>
          </Box>
        ) : (
          <Box>
            <StyledListHeader onClick={() => setMenuView("main")}>
              <NavigateBeforeIcon />
              {t("userMenu.back")}
            </StyledListHeader>
            <MenuItem>
              {menuView === "theme" ? (
                <ThemeSelect fullWidth />
              ) : (
                <LanguageSelect fullWidth />
              )}
            </MenuItem>
          </Box>
        )}
      </Menu>
    </>
  );
};

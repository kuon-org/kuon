import { useState } from "react";
import { useAuthQuery } from "../../../hooks/useAuth";
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
import { useNavigate } from "@tanstack/react-router";
import { ThemeSelect } from "../../common/ThemeSelect";
import ContrastIcon from "@mui/icons-material/Contrast";
import DeleteIcon from "@mui/icons-material/Delete";
import styled from "@emotion/styled";
import { stocksRoute } from "../../../router";

const StyledListHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  fontWeight: "bold",
  padding: "8px 16px",
  cursor: "pointer",
});

export const UserIcon = () => {
  const { user, logout, logout_isPending } = useAuthQuery();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showThemeSelect, setShowThemeSelect] = useState(false);
  const navigate = useNavigate();

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setShowThemeSelect(false);
  };

  const handleLogout = async () => {
    logout();
    handleCloseMenu();
  };

  const handleMyPage = () => {
    if (user && user.username) {
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
          src={user?.avatar_url}
          alt={user?.display_name}
          sx={{ width: 32, height: 32, bgcolor: "grey.200" }}
        />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: {
              width: 280,
            },
          },
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {!showThemeSelect ? (
          <Box>
            <MenuItem onClick={handleMyPage}>
              <PersonIcon sx={{ mr: 1 }} />
              マイページ
            </MenuItem>
            <MenuItem onClick={handleStocks}>
              <InventoryIcon sx={{ mr: 1 }} />
              ストックリスト
            </MenuItem>
            <MenuItem onClick={() => setShowThemeSelect(true)}>
              <ContrastIcon sx={{ mr: 1 }} />
              テーマカラー
            </MenuItem>

            <Divider />
            <MenuItem onClick={handleDrafts}>
              <EditNoteIcon sx={{ mr: 1 }} />
              下書き一覧
            </MenuItem>
            <MenuItem onClick={handleTrash}>
              <DeleteIcon sx={{ mr: 1 }} />
              ゴミ箱
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSettings}>
              <SettingsIcon sx={{ mr: 1 }} />
              設定
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              {logout_isPending ? "ログアウト中..." : "ログアウト"}
            </MenuItem>
          </Box>
        ) : (
          <Box>
            <StyledListHeader onClick={() => setShowThemeSelect(false)}>
              <NavigateBeforeIcon />
              ユーザーメニューへ戻る
            </StyledListHeader>
            <MenuItem>
              <ThemeSelect label="テーマ" fullWidth />
            </MenuItem>
          </Box>
        )}
      </Menu>
    </>
  );
};

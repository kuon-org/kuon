import {
  Divider,
  Paper,
  Typography,
  Box,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useAdminQuery } from "../../hooks/useAdmin";
import Loading from "../../components/common/Loading/Loading";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { userProfileIndexRoute } from "../../routes";

export const UserManagement = () => {
  const { users, users_isLoading, users_isError, user_toggle_active } =
    useAdminQuery();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user); // ユーザー情報をセット
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleToggleActive = () => {
    if (!selectedUser) return;
    user_toggle_active(selectedUser.id);
    handleMenuClose(); // 実行後にメニューを閉じる
  };

  if (users_isLoading) return <Loading />;
  if (users_isError || !users) return <>取得に失敗</>;

  // 1. 統計データの算出
  const totalCount = users.length;
  const activeCount = users.filter((u: any) => u.is_active).length;
  const inactiveCount = totalCount - activeCount;

  // 2. Data Grid の列定義 (columns)
  const columns: GridColDef[] = [
    {
      field: "avatar_url",
      headerName: "#",
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Link
            to={userProfileIndexRoute.to}
            params={{ username: params.row.username }}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Tooltip
              title={
                <Box sx={{ textAlign: "center" }}>
                  <Typography>@{params.row.username}</Typography>
                  <Typography>{params.row.display_name}</Typography>
                </Box>
              }
              disableInteractive
              slotProps={{ popper: { sx: { pointerEvents: "none" } } }}
            >
              <Avatar
                src={params.value}
                alt={params.row.display_name}
                sx={{ width: 30, height: 30, bgcolor: "grey.200" }}
              />
            </Tooltip>
          </Link>
        </Box>
      ),
    },
    {
      field: "is_active",
      headerName: "ステータス",
      width: 180,
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", height: "100%" }}
        >
          <Chip
            label={params.value ? "Active" : "Inactive"}
            color={params.value ? "success" : "default"}
            size="small"
            variant="outlined"
          />
          {/* JSONにroleがない場合を考慮し、フォールバックを設定 */}
          <Chip
            label={params.row.role || "general"}
            size="small"
            variant="filled"
          />
        </Stack>
      ),
    },
    {
      field: "username",
      headerName: "ユーザ名",
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: "medium" }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "display_name",
      headerName: "表示名",
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: "medium" }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },

    {
      field: "email",
      headerName: "メールアドレス",
      flex: 1, // 余ったスペースを埋める
      minWidth: 200,
    },
    {
      field: "created_at",
      headerName: "作成日",
      width: 150,
      valueFormatter: (value) => {
        if (!value) return "";
        return new Date(value).toLocaleString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      field: "last_login_at",
      headerName: "最終ログイン",
      width: 150,
      valueFormatter: (value) => {
        if (!value) return "";
        return new Date(value).toLocaleString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      field: "actions",
      headerName: "", // ヘッダー名は空でもOK
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, params.row)} // IDではなくrowデータ（ユーザー情報）を渡す
          >
            <SettingsIcon fontSize="small" />
            <ArrowDropDownIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Paper
        elevation={0} // お好みで調整
        sx={{
          mx: "auto",
          p: 3,
          minWidth: { xs: "100%", md: "600px", lg: "850px" },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          ユーザ管理
        </Typography>

        {/* 統計セクション */}
        <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              総ユーザ数
            </Typography>
            <Typography variant="h6">{totalCount}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              アクティブ
            </Typography>
            <Typography variant="h6" color="success.main">
              {activeCount}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              非アクティブ
            </Typography>
            <Typography variant="h6" color="error.main">
              {inactiveCount}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
          ユーザ詳細一覧
        </Typography>

        {/* テーブルセクション (Data Grid) */}
        <Box sx={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={users}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
              // デフォルトで作成日の新しい順に並び替え
              sorting: {
                sortModel: [{ field: "created_at", sort: "desc" }],
              },
            }}
            pageSizeOptions={[5, 10, 20]}
            disableRowSelectionOnClick
            disableColumnMenu={false} // フィルタリングメニューを有効化
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "grey.50",
              },
            }}
          />
        </Box>
      </Paper>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleToggleActive}>
          <ListItemIcon>
            {selectedUser?.is_active ? (
              <CancelOutlinedIcon fontSize="small" color="error" />
            ) : (
              <CheckCircleOutlineIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.is_active ? "アカウント停止" : "アカウント有効化"}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

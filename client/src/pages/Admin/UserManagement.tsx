import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { useAdminQuery } from "../../hooks/useAdmin";
import { useAdminPermissions, useRoleManagement } from "../../hooks/useRoles";
import Loading from "../../components/common/Loading/Loading";
import { userProfileIndexRoute } from "../../routes";

interface ManagedRole {
  id: string;
  name: string;
  display_name?: string | null;
}

export const UserManagement = () => {
  const { users, users_isLoading, users_isError, user_toggle_active } = useAdminQuery();
  const { permissions } = useAdminPermissions();
  const canAssignRoles = permissions.includes("role.assign");
  const { roles, assignRoles, assignRoles_isPending } = useRoleManagement(canAssignRoles);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleToggleActive = () => {
    if (!selectedUser) return;
    user_toggle_active(selectedUser.id);
    handleMenuClose();
  };

  const openRoleDialog = () => {
    if (!selectedUser) return;
    const currentRoles = (selectedUser.roles ?? []) as ManagedRole[];
    setSelectedRoleIds(currentRoles.map((role) => role.id));
    setRoleDialogOpen(true);
    handleMenuClose();
  };

  const saveRoles = async () => {
    if (!selectedUser) return;
    await assignRoles({ userId: selectedUser.id, roleIds: selectedRoleIds });
    setRoleDialogOpen(false);
    setSelectedUser(null);
  };

  if (users_isLoading) return <Loading />;
  if (users_isError || !users) return <>取得に失敗しました</>;

  const totalCount = users.length;
  const activeCount = users.filter((user: any) => user.is_active).length;
  const inactiveCount = totalCount - activeCount;

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
      headerName: "ステータス / ロール",
      width: 280,
      renderCell: (params) => {
        const assignedRoles = (params.row.roles ?? []) as ManagedRole[];
        return (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", height: "100%" }}>
            <Chip
              label={params.value ? "Active" : "Inactive"}
              color={params.value ? "success" : "default"}
              size="small"
              variant="outlined"
            />
            {assignedRoles.slice(0, 2).map((role) => (
              <Chip key={role.id} label={role.display_name || role.name} size="small" />
            ))}
            {assignedRoles.length > 2 && <Chip label={`+${assignedRoles.length - 2}`} size="small" />}
          </Stack>
        );
      },
    },
    { field: "username", headerName: "ユーザ名", width: 130 },
    { field: "display_name", headerName: "表示名", width: 150 },
    { field: "email", headerName: "メールアドレス", flex: 1, minWidth: 200 },
    {
      field: "created_at",
      headerName: "作成日",
      width: 150,
      valueFormatter: (value) =>
        value
          ? new Date(value).toLocaleString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
    },
    {
      field: "last_login_at",
      headerName: "最終ログイン",
      width: 150,
      valueFormatter: (value) =>
        value
          ? new Date(value).toLocaleString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
    },
    {
      field: "actions",
      headerName: "",
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <IconButton size="small" onClick={(event) => handleMenuOpen(event, params.row)}>
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
        elevation={0}
        sx={{
          mx: "auto",
          p: 3,
          minWidth: { xs: "100%", md: "650px", lg: "900px" },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          ユーザ管理
        </Typography>
        <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
          <Box><Typography variant="caption" color="text.secondary">総ユーザ数</Typography><Typography variant="h6">{totalCount}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">アクティブ</Typography><Typography variant="h6" color="success.main">{activeCount}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">非アクティブ</Typography><Typography variant="h6" color="error.main">{inactiveCount}</Typography></Box>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ height: 520, width: "100%" }}>
          <DataGrid
            rows={users}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } },
              sorting: { sortModel: [{ field: "created_at", sort: "desc" }] },
            }}
            pageSizeOptions={[5, 10, 20]}
            disableRowSelectionOnClick
          />
        </Box>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
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
          <ListItemText>{selectedUser?.is_active ? "アカウント停止" : "アカウント有効化"}</ListItemText>
        </MenuItem>
        {canAssignRoles && (
          <MenuItem onClick={openRoleDialog}>
            <ListItemIcon><AdminPanelSettingsOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>ロールを設定</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>ロールを設定</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            @{selectedUser?.username} に割り当てるロールを選択してください。複数ロールのPermissionは和集合として扱われます。
          </Typography>
          <FormGroup>
            {roles.map((role) => (
              <FormControlLabel
                key={role.id}
                control={
                  <Checkbox
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={(_, checked) =>
                      setSelectedRoleIds((current) =>
                        checked
                          ? [...new Set([...current, role.id])]
                          : current.filter((id) => id !== role.id),
                      )
                    }
                  />
                }
                label={role.display_name || role.name}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            disabled={assignRoles_isPending || selectedRoleIds.length === 0}
            onClick={() => void saveRoles()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

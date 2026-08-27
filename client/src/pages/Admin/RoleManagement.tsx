import {
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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import Loading from "../../components/common/Loading/Loading";
import {
  type PermissionDefinition,
  type RoleDefinition,
  useRoleManagement,
} from "../../hooks/useRoles";

const categoryLabels: Record<string, string> = {
  article: "記事",
  comment: "コメント",
  user: "ユーザー",
  role: "ロール",
  system: "システム",
};

interface EditorState {
  roleId?: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  builtin: boolean;
}

const emptyEditor = (): EditorState => ({
  name: "",
  displayName: "",
  description: "",
  permissions: [],
  builtin: false,
});

export const RoleManagement = () => {
  const {
    permissions,
    roles,
    isLoading,
    isError,
    createRole,
    updateRole,
    deleteRole,
    createRole_isPending,
    updateRole_isPending,
    deleteRole_isPending,
  } = useRoleManagement();
  const [editor, setEditor] = useState<EditorState | null>(null);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, PermissionDefinition[]>>(
      (groups, permission) => {
        (groups[permission.category] ??= []).push(permission);
        return groups;
      },
      {},
    );
  }, [permissions]);

  const openRole = (role: RoleDefinition) => {
    setEditor({
      roleId: role.id,
      name: role.name,
      displayName: role.display_name ?? role.name,
      description: role.description ?? "",
      permissions: role.permissions,
      builtin: role.is_builtin,
    });
  };

  const togglePermission = (permission: PermissionDefinition, checked: boolean) => {
    setEditor((current) => {
      if (!current) return current;
      const selected = new Set(current.permissions);
      if (checked) {
        selected.add(permission.key);
        permission.requires.forEach((dependency) => selected.add(dependency));
      } else {
        selected.delete(permission.key);
        // Removing a required permission also removes permissions that depend on it.
        let changed = true;
        while (changed) {
          changed = false;
          permissions.forEach((candidate) => {
            if (
              selected.has(candidate.key) &&
              candidate.requires.some((dependency) => !selected.has(dependency))
            ) {
              selected.delete(candidate.key);
              changed = true;
            }
          });
        }
      }
      return { ...current, permissions: [...selected] };
    });
  };

  const save = async () => {
    if (!editor) return;
    if (editor.roleId) {
      await updateRole({
        roleId: editor.roleId,
        displayName: editor.displayName,
        description: editor.description,
        permissions: editor.permissions,
      });
    } else {
      await createRole({
        name: editor.name,
        displayName: editor.displayName,
        description: editor.description,
        permissions: editor.permissions,
      });
    }
    setEditor(null);
  };

  if (isLoading) return <Loading />;
  if (isError) return <Typography>ロール情報の取得に失敗しました</Typography>;

  return (
    <Paper
      elevation={0}
      sx={{
        mx: "auto",
        p: 3,
        minWidth: { xs: "100%", md: 650, lg: 850 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            ロールと権限
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            PermissionはKuonが定義し、ロールごとに利用可能な操作を組み合わせます。
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setEditor(emptyEditor())}>
          ロールを追加
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1.5}>
        {roles.map((role) => (
          <Paper key={role.id} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight="bold">
                    {role.display_name || role.name}
                  </Typography>
                  {role.is_builtin && <Chip label="組み込み" size="small" variant="outlined" />}
                  <Chip label={role.name} size="small" />
                </Stack>
                {role.description && (
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {role.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {role.permissions.length} permissions
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button size="small" onClick={() => openRole(role)}>
                  編集
                </Button>
                {!role.is_builtin && (
                  <Button
                    size="small"
                    color="error"
                    disabled={deleteRole_isPending}
                    onClick={() => void deleteRole(role.id)}
                  >
                    削除
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Dialog open={!!editor} onClose={() => setEditor(null)} fullWidth maxWidth="md">
        {editor && (
          <>
            <DialogTitle>{editor.roleId ? "ロールを編集" : "ロールを追加"}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Role key"
                  value={editor.name}
                  disabled={!!editor.roleId}
                  helperText="英小文字・数字・_・- を使用できます。作成後は変更できません。"
                  onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                />
                <TextField
                  label="表示名"
                  value={editor.displayName}
                  onChange={(e) => setEditor({ ...editor, displayName: e.target.value })}
                />
                <TextField
                  label="説明"
                  value={editor.description}
                  multiline
                  minRows={2}
                  onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                />

                <Divider />
                {Object.entries(groupedPermissions).map(([category, items]) => (
                  <Box key={category}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={0.5}>
                      {categoryLabels[category] ?? category}
                    </Typography>
                    <Stack>
                      {items.map((permission) => {
                        const checked = editor.permissions.includes(permission.key);
                        const requiredBy = permissions.filter(
                          (candidate) =>
                            editor.permissions.includes(candidate.key) &&
                            candidate.requires.includes(permission.key),
                        );
                        return (
                          <FormControlLabel
                            key={permission.key}
                            control={
                              <Checkbox
                                checked={checked}
                                onChange={(_, value) => togglePermission(permission, value)}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2">{permission.displayName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {permission.key}
                                  {requiredBy.length > 0
                                    ? ` · ${requiredBy.map((item) => item.displayName).join(" / ")} が依存`
                                    : ""}
                                </Typography>
                              </Box>
                            }
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditor(null)}>キャンセル</Button>
              <Button
                variant="contained"
                disabled={
                  createRole_isPending ||
                  updateRole_isPending ||
                  !editor.name.trim() ||
                  !editor.displayName.trim()
                }
                onClick={() => void save()}
              >
                保存
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

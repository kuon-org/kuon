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
  useCreateRole,
  useDeleteRole,
  usePermissionCatalogQuery,
  useRolesQuery,
  useUpdateRole,
} from "../../hooks/roles";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("admin");
  const permissionsQuery = usePermissionCatalogQuery();
  const rolesQuery = useRolesQuery();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const permissions = permissionsQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const [editor, setEditor] = useState<EditorState | null>(null);
  const groupedPermissions = useMemo(
    () =>
      permissions.reduce<Record<string, PermissionDefinition[]>>(
        (groups, permission) => {
          (groups[permission.category] ??= []).push(permission);
          return groups;
        },
        {},
      ),
    [permissions],
  );

  const openRole = (role: RoleDefinition) =>
    setEditor({
      roleId: role.id,
      name: role.name,
      displayName: role.display_name ?? role.name,
      description: role.description ?? "",
      permissions: role.permissions,
      builtin: role.is_builtin,
    });
  const togglePermission = (
    permission: PermissionDefinition,
    checked: boolean,
  ) => {
    setEditor((current) => {
      if (!current) return current;
      const selected = new Set(current.permissions);
      if (checked) {
        selected.add(permission.key);
        permission.requires.forEach((dependency) => selected.add(dependency));
      } else {
        selected.delete(permission.key);
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
    if (editor.roleId)
      await updateRole.mutateAsync({
        roleId: editor.roleId,
        displayName: editor.displayName,
        description: editor.description,
        permissions: editor.permissions,
      });
    else
      await createRole.mutateAsync({
        name: editor.name,
        displayName: editor.displayName,
        description: editor.description,
        permissions: editor.permissions,
      });
    setEditor(null);
  };

  if (permissionsQuery.isLoading || rolesQuery.isLoading) return <Loading />;
  if (permissionsQuery.isError || rolesQuery.isError)
    return <Typography>{t("roles.loadFailed")}</Typography>;

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
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {t("roles.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {t("roles.description")}
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setEditor(emptyEditor())}>
          {t("roles.add")}
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
                  {role.is_builtin && (
                    <Chip
                      label={t("roles.builtin")}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  <Chip label={role.name} size="small" />
                </Stack>
                {role.description && (
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {role.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {t("roles.permissionCount", {
                    count: role.permissions.length,
                  })}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button size="small" onClick={() => openRole(role)}>
                  {t("common.edit")}
                </Button>
                {!role.is_builtin && (
                  <Button
                    size="small"
                    color="error"
                    disabled={deleteRole.isPending}
                    onClick={() => void deleteRole.mutateAsync(role.id)}
                  >
                    {t("common.delete")}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Dialog
        open={!!editor}
        onClose={() => setEditor(null)}
        fullWidth
        maxWidth="md"
      >
        {editor && (
          <>
            <DialogTitle>
              {editor.roleId ? t("roles.edit") : t("roles.add")}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("roles.roleKey")}
                  value={editor.name}
                  disabled={!!editor.roleId}
                  helperText={t("roles.roleKeyHint")}
                  onChange={(e) =>
                    setEditor({ ...editor, name: e.target.value })
                  }
                />
                <TextField
                  label={t("roles.displayName")}
                  value={editor.displayName}
                  onChange={(e) =>
                    setEditor({ ...editor, displayName: e.target.value })
                  }
                />
                <TextField
                  label={t("roles.descriptionLabel")}
                  value={editor.description}
                  multiline
                  minRows={2}
                  onChange={(e) =>
                    setEditor({ ...editor, description: e.target.value })
                  }
                />
                <Divider />
                {Object.entries(groupedPermissions).map(([category, items]) => (
                  <Box key={category}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={0.5}>
                      {t(`categories.${category}`, { defaultValue: category })}
                    </Typography>
                    <Stack>
                      {items.map((permission) => {
                        const checked = editor.permissions.includes(
                          permission.key,
                        );
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
                                onChange={(_, value) =>
                                  togglePermission(permission, value)
                                }
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2">
                                  {permission.displayName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {permission.key}
                                  {requiredBy.length > 0
                                    ? ` · ${t("roles.dependency", { names: requiredBy.map((item) => item.displayName).join(" / ") })}`
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
              <Button onClick={() => setEditor(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="contained"
                disabled={
                  createRole.isPending ||
                  updateRole.isPending ||
                  !editor.name.trim() ||
                  !editor.displayName.trim()
                }
                onClick={() => void save()}
              >
                {t("common.save")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

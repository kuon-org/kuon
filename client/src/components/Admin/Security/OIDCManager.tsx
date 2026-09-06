// src/components/admin/Auth/OIDCManager.tsx
import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AuthSettingForm } from "./AuthSettingForm";
import { useDeleteIdpConfig, useIdpListQuery, useUpdateIdpConfig } from "../../../hooks/admin";
import { useNotify } from "../../../hooks/useNotify";

export const OIDCManager = () => {
  const { t } = useTranslation("admin");
  const idpListQuery = useIdpListQuery();
  const updateIdpConfig = useUpdateIdpConfig();
  const deleteIdpConfig = useDeleteIdpConfig();
  const allIdps = idpListQuery.data;
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [newSuffix, setNewSuffix] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { error } = useNotify();
  const oidcItems =
    allIdps?.filter(
      (p) =>
        p.configured &&
        (p.provider_name === "oidc" || p.provider_name.startsWith("oidc-")),
    ) ?? [];
  const oidcProviders = oidcItems.map((p) => p.provider_name);
  const selectedItem = oidcItems.find(
    (provider) => provider.provider_name === selectedProvider,
  );

  const handleAdd = async () => {
    if (!newSuffix) return;
    const newName = `oidc-${newSuffix.toLowerCase().trim()}`;

    if (allIdps?.some((provider) => provider.provider_name === newName)) {
      error(t("security.idp.manager.duplicate"));
      return;
    }

    setIsAdding(true);
    try {
      await updateIdpConfig.mutateAsync({
        provider_name: newName,
        config: {
          issuer_host: "",
          client_id: "",
          client_secret: "",
          scope: "openid profile email",
        },
      });
      await idpListQuery.refetch();
      setSelectedProvider(newName);
      setNewSuffix("");
    } catch (e) {
      console.error(e);
      error(t("security.idp.manager.addFailed"));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "delete me" || !selectedProvider) return;

    setIsDeleting(true);
    try {
      await deleteIdpConfig.mutateAsync(selectedProvider);
      setOpenDeleteModal(false);
      setDeleteConfirmText("");
      setSelectedProvider("");
      await idpListQuery.refetch();
    } catch {
      error(t("security.idp.manager.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (idpListQuery.isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box
        sx={{
          p: 2,
          display: "flex",
          gap: 2,
          alignItems: "flex-end",
          borderRadius: 1,
          mb: 3,
        }}
      >
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>{t("security.idp.manager.editProvider")}</InputLabel>
          <Select
            value={selectedProvider}
            label={t("security.idp.manager.editProvider")}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            {oidcProviders.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={t("security.idp.manager.addProvider", { type: "OIDC" })}
          variant="standard"
          placeholder={t("security.idp.manager.oidcPlaceholder")}
          size="small"
          value={newSuffix}
          onChange={(e) => setNewSuffix(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">oidc-</InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          onClick={handleAdd}
          startIcon={<AddIcon />}
          disabled={!newSuffix || isAdding}
        >
          {isAdding
            ? t("security.idp.manager.adding")
            : t("security.idp.manager.add")}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setOpenDeleteModal(true)}
          disabled={
            !selectedProvider ||
            selectedProvider === "oidc" ||
            selectedItem?.readOnly
          }
        >
          {t("common.delete")}
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {selectedProvider && (
        <AuthSettingForm
          key={selectedProvider}
          provider_name={selectedProvider}
        />
      )}

      <Dialog
        open={openDeleteModal}
        onClose={() => !isDeleting && setOpenDeleteModal(false)}
      >
        <DialogTitle>
          {t("security.idp.manager.deleteTitle", { type: "OIDC" })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {t("security.idp.manager.deleteDescription", {
              provider: selectedProvider,
              confirmation: "delete me",
            })}
          </DialogContentText>
          <TextField
            fullWidth
            size="small"
            placeholder="delete me"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenDeleteModal(false)}
            disabled={isDeleting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteConfirmText !== "delete me" || isDeleting}
          >
            {isDeleting
              ? t("security.idp.manager.deleting")
              : t("security.idp.manager.deletePermanently")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

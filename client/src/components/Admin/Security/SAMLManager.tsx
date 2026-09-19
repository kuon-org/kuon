// src/components/admin/Auth/SAMLManager.tsx
import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AuthSettingForm } from "./AuthSettingForm";
import {
  useDeleteIdpConfig,
  useIdpListQuery,
  useUpdateIdpConfig,
} from "../../../hooks/admin";
import { useNotify } from "../../../hooks/useNotify";

export const SAMLManager = () => {
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

  const samlItems =
    allIdps?.filter(
      (p) =>
        p.configured &&
        (p.provider_name === "saml" || p.provider_name.startsWith("saml-")),
    ) ?? [];
  const samlProviders = samlItems.map((p) => p.provider_name);
  const selectedItem = samlItems.find(
    (provider) => provider.provider_name === selectedProvider,
  );

  const handleAdd = async () => {
    if (!newSuffix) return;
    setIsAdding(true);
    const newName = `saml-${newSuffix.toLowerCase().trim()}`;

    try {
      if (allIdps?.some((provider) => provider.provider_name === newName)) {
        error(t("security.idp.manager.duplicate"));
        return;
      }
      await updateIdpConfig.mutateAsync({
        provider_name: newName,
        provider_type: "SAML",
        config: {
          entry_point: "",
          issuer: "",
          cert: "",
        },
      });
      await idpListQuery.refetch();
      setSelectedProvider(newName);
      setNewSuffix("");
    } catch (error_) {
      console.error("Failed to create SAML provider:", error_);
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
      setSelectedProvider("");
      setOpenDeleteModal(false);
      setDeleteConfirmText("");
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
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "flex-end" }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>{t("security.idp.manager.editProvider")}</InputLabel>
          <Select
            value={selectedProvider}
            label={t("security.idp.manager.editProvider")}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            {samlProviders.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label={t("security.idp.manager.addProvider", { type: "SAML" })}
          variant="standard"
          placeholder={t("security.idp.manager.samlPlaceholder")}
          value={newSuffix}
          onChange={(e) => setNewSuffix(e.target.value)}
          disabled={isAdding}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">saml-</InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={isAdding ? <CircularProgress size={20} /> : <AddIcon />}
          onClick={handleAdd}
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
          disabled={!selectedProvider || selectedItem?.readOnly}
        >
          {t("common.delete")}
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

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
          {t("security.idp.manager.deleteTitle", { type: "SAML" })}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteModal(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
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

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
import { AuthSettingForm } from "./AuthSettingForm";
import { useAdminQuery } from "../../../hooks/useAdmin";
import { useNotify } from "../../../hooks/useNotify";

export const OIDCManager = () => {
  const {
    allIdps,
    allIdps_isLoading,
    refetchIdpList,
    updateIdpConf,
    deleteIdpConf,
  } = useAdminQuery();
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
      error("そのプロバイダ名は既に存在します");
      return;
    }

    setIsAdding(true);
    try {
      await updateIdpConf({
        provider_name: newName,
        config: {
          issuer_host: "",
          client_id: "",
          client_secret: "",
          scope: "openid profile email",
        },
      });
      await refetchIdpList();
      setSelectedProvider(newName);
      setNewSuffix("");
    } catch (e) {
      console.error(e);
      error("プロバイダの追加に失敗しました");
    } finally {
      setIsAdding(false);
    }
  };
  const handleDelete = async () => {
    if (deleteConfirmText !== "delete me" || !selectedProvider) return;

    setIsDeleting(true);
    try {
      await deleteIdpConf(selectedProvider);
      setOpenDeleteModal(false);
      setDeleteConfirmText("");
      setSelectedProvider("");
      await refetchIdpList();
    } catch (e) {
      error("削除に失敗しました。ユーザーが既に連携している可能性があります。");
    } finally {
      setIsDeleting(false);
    }
  };
  if (allIdps_isLoading) return <CircularProgress />;

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
          <InputLabel>編集するプロバイダ</InputLabel>
          <Select
            value={selectedProvider}
            label="編集するプロバイダ"
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
          label="新規OIDCプロバイダ追加"
          variant="standard"
          placeholder="google など"
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
          {isAdding ? "追加中..." : "追加"}
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
          削除
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
        <DialogTitle>OIDC設定の削除</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            プロバイダ <strong>{selectedProvider}</strong>{" "}
            を削除しようとしています。
            この操作は取り消せません。実行するには以下に{" "}
            <strong>delete me</strong> と入力してください。
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
            キャンセル
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteConfirmText !== "delete me" || isDeleting}
          >
            {isDeleting ? "削除中..." : "完全に削除する"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
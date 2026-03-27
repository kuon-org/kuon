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
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { AuthSettingForm } from "./AuthSettingForm";
import { useAdminQuery } from "../../../hooks/useAdmin";

export const SAMLManager = () => {
  const {
    allIdps,
    allIdps_isLoading,
    refetchIdpList,
    updateIdpConf,
    deleteIdpConf,
  } = useAdminQuery();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [newSuffix, setNewSuffix] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // 削除用ステート
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // SAML系のプロバイダを抽出
  const samlProviders =
    allIdps
      ?.filter(
        (p) =>
          p.provider_name === "saml" || p.provider_name.startsWith("saml-"),
      )
      .map((p) => p.provider_name) || [];

  // 新規作成（最低限の設定でupsert）
  const handleAdd = async () => {
    if (!newSuffix) return;
    setIsAdding(true);
    const newName = `saml-${newSuffix.toLowerCase().trim()}`;

    try {
      await updateIdpConf({
        provider_name: newName,
        provider_type: "SAML", // ここが重要
        config: {
          entry_point: "",
          issuer: "",
          cert: "",
        },
      });
      await refetchIdpList();
      setSelectedProvider(newName);
      setNewSuffix("");
    } catch (error) {
      console.error("Failed to create SAML provider:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProvider) return;
    setIsDeleting(true);
    try {
      await deleteIdpConf(selectedProvider);
      setSelectedProvider(null);
      setOpenDeleteModal(false);
      setDeleteConfirmText("");
    } finally {
      setIsDeleting(false);
    }
  };

  if (allIdps_isLoading) return <CircularProgress />;

  return (
    <Box>
      {/* 新規追加エリア */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "flex-end" }}>
        <TextField
          label="新規SAMLプロバイダ"
          variant="standard"
          placeholder="keycloak など"
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
          追加
        </Button>
      </Box>

      {/* プロバイダ選択ボタン一覧 */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
        {samlProviders.map((name) => (
          <Box key={name} sx={{ display: "flex", alignItems: "center" }}>
            <Button
              variant={selectedProvider === name ? "contained" : "outlined"}
              onClick={() => setSelectedProvider(name)}
              sx={{ borderRadius: "4px 0 0 4px" }}
            >
              {name}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setSelectedProvider(name);
                setOpenDeleteModal(true);
              }}
              sx={{
                minWidth: 40,
                px: 1,
                borderRadius: "0 4px 4px 0",
                borderLeft: "none",
              }}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 詳細設定フォーム */}
      {selectedProvider && (
        <AuthSettingForm
          key={selectedProvider}
          provider_name={selectedProvider}
        />
      )}

      {/* 削除確認ダイアログ */}
      <Dialog
        open={openDeleteModal}
        onClose={() => !isDeleting && setOpenDeleteModal(false)}
      >
        <DialogTitle>SAML設定の削除</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            プロバイダ <strong>{selectedProvider}</strong> を削除しますか？
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
          <Button onClick={() => setOpenDeleteModal(false)}>キャンセル</Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={deleteConfirmText !== "delete me" || isDeleting}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

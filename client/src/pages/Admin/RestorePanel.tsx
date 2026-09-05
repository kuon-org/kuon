import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Typography } from "@mui/material";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import apiClient from "../../api/client";
import type { ApiError } from "../../api/FetchHttpClient";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useTranslation } from "react-i18next";

export const RestorePanel = ({ onError }: { onError: (message: string | null) => void }) => {
  const { t } = useTranslation("admin");
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const restore = async () => {
    if (!file || confirmation !== "RESTORE") return;
    onError(null);
    setIsRestoring(true);
    try {
      const form = new FormData();
      form.append("backup", file);
      await apiClient.post("/admin/backup/restore", form);
      queryClient.clear();
      window.location.assign("/login");
    } catch (error) {
      onError(getApiErrorMessage(error as ApiError, t("backup.restoreFailed")));
      setOpen(false);
      setConfirmation("");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>{t("backup.restoreTitle")}</Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>{t("backup.restoreWarning")}</Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("backup.restoreDescription")}</Typography>
      <Button variant="outlined" component="label" disabled={isRestoring} sx={{ mr: 2 }}>
        {t("backup.chooseFile")}
        <input hidden type="file" accept=".gz,.tgz,application/gzip" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Button>
      {file && <Typography component="span" variant="body2">{file.name}</Typography>}
      <Box sx={{ mt: 2 }}><Button color="error" variant="contained" startIcon={<RestoreOutlinedIcon />} disabled={!file || isRestoring} onClick={() => setOpen(true)}>{t("backup.restore")}</Button></Box>
      <Dialog open={open} onClose={isRestoring ? undefined : () => setOpen(false)}>
        <DialogTitle>{t("backup.restoreConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t("backup.restoreConfirmDescription")}</DialogContentText>
          <TextField autoFocus fullWidth value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={isRestoring} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={isRestoring}>{t("common.cancel")}</Button>
          <Button color="error" variant="contained" onClick={restore} disabled={confirmation !== "RESTORE" || isRestoring} startIcon={isRestoring ? <CircularProgress size={18} /> : <RestoreOutlinedIcon />}>
            {isRestoring ? t("backup.restoring") : t("backup.executeRestore")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

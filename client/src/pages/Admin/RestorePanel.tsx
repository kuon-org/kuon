import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import apiClient from "../../api/client";

export const RestorePanel = ({ onError }: { onError: (message: string | null) => void }) => {
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
    } catch (error: any) {
      onError(error?.response?.data?.message ?? "復元に失敗しました。サーバログを確認してください。");
      setOpen(false);
      setConfirmation("");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>Restore</Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>
        現在のデータベースとアップロード済みファイルをバックアップ時点へ置き換えます。完了後は全セッションが無効化され、メンテナンスモードが有効になります。
      </Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        .env、DATABASE_URL、JWT Secret、Reverse Proxy等のインフラ設定は復元対象外です。
      </Typography>
      <Button variant="outlined" component="label" disabled={isRestoring} sx={{ mr: 2 }}>
        バックアップファイルを選択
        <input hidden type="file" accept=".gz,.tgz,application/gzip" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Button>
      {file && <Typography component="span" variant="body2">{file.name}</Typography>}
      <Box sx={{ mt: 2 }}>
        <Button color="error" variant="contained" startIcon={<RestoreOutlinedIcon />} disabled={!file || isRestoring} onClick={() => setOpen(true)}>
          復元する
        </Button>
      </Box>

      <Dialog open={open} onClose={isRestoring ? undefined : () => setOpen(false)}>
        <DialogTitle>バックアップから復元しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            実行前に現在のDBを一時退避し、失敗時は可能な限り元へ戻します。続行するには RESTORE と入力してください。
          </DialogContentText>
          <TextField autoFocus fullWidth value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={isRestoring} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={isRestoring}>キャンセル</Button>
          <Button color="error" variant="contained" onClick={restore} disabled={confirmation !== "RESTORE" || isRestoring} startIcon={isRestoring ? <CircularProgress size={18} /> : <RestoreOutlinedIcon />}>
            {isRestoring ? "復元中..." : "復元を実行"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

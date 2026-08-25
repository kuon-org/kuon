import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import apiClient from "../../api/client";

const getFileName = (contentDisposition?: string) => {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? "kuon-backup.tar.gz";
};

export const BackupRestore = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportBackup = async () => {
    setError(null);
    setIsExporting(true);

    try {
      const response = await apiClient.post<Blob>(
        "/admin/backup/export",
        undefined,
        { responseType: "blob" },
      );

      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getFileName(response.headers["content-disposition"]);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("バックアップの作成に失敗しました。サーバログを確認してください。");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mx: "auto",
        p: 3,
        minWidth: { xs: "100%", md: "600px", lg: "850px" },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>
        Backup & Restore
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Kuonのデータベースとアップロード済みファイルを、移行・障害復旧用のバックアップとして保存できます。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Backup
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          PostgreSQLの論理バックアップ、uploads、manifestを1つのtar.gzとしてダウンロードします。.envやインフラ固有のSecretは含まれません。
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          DBとuploadsの更新を完全に止めて取得したい場合は、先にメンテナンスモードを有効にしてください。
        </Alert>
        <Button
          variant="contained"
          startIcon={isExporting ? <CircularProgress size={18} /> : <DownloadOutlinedIcon />}
          onClick={exportBackup}
          disabled={isExporting}
        >
          {isExporting ? "バックアップ作成中..." : "バックアップを作成"}
        </Button>
      </Box>

      <Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Restore
        </Typography>
        <Typography variant="body2" color="text.secondary">
          バックアップからの復元は今後のアップデートで対応予定です。
        </Typography>
      </Box>
    </Paper>
  );
};

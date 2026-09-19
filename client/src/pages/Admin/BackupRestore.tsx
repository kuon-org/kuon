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
import { RestorePanel } from "./RestorePanel";
import { useTranslation } from "react-i18next";

const getFileName = (contentDisposition?: string) => {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? "kuon-backup.tar.gz";
};

export const BackupRestore = () => {
  const { t } = useTranslation("admin");
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
      setError(t("backup.exportFailed"));
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
        {t("backup.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("backup.description")}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          {t("backup.backupTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("backup.backupDescription")}
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("backup.maintenanceHint")}
        </Alert>
        <Button
          variant="contained"
          startIcon={
            isExporting ? (
              <CircularProgress size={18} />
            ) : (
              <DownloadOutlinedIcon />
            )
          }
          onClick={exportBackup}
          disabled={isExporting}
        >
          {isExporting ? t("backup.creating") : t("backup.create")}
        </Button>
      </Box>
      <RestorePanel onError={setError} />
    </Paper>
  );
};

import type { ReactNode } from "react";
import { Paper, Box, Typography, Divider, Button } from "@mui/material";
import { useAuthUserQuery, useUploadedImagesQuery } from "../../hooks/auth";
import { ZoomableContent } from "../../components/common/ZoomableContent";
import { useTranslation } from "react-i18next";

const mimeToExt: Record<string, string> = { "image/png": "png", "image/jpeg": "jpeg", "image/gif": "gif", "image/webp": "webp" };

export const UploadedImages = () => {
  const { t, i18n } = useTranslation("settings");
  const authUserQuery = useAuthUserQuery();
  const uploadedImagesQuery = useUploadedImagesQuery(!!authUserQuery.data);
  const uploadedImages = uploadedImagesQuery.data;
  const shell = (content: ReactNode) => <Paper sx={{ mx: "auto", flex: 1, p: 3, maxWidth: { md: "450px", lg: "600px" } }}>{content}</Paper>;
  if (uploadedImagesQuery.isLoading) return shell(<Typography>{t("uploads.loading")}</Typography>);
  if (!uploadedImages || uploadedImages.length === 0) return shell(<Typography>{t("uploads.empty")}</Typography>);
  const handleCopy = (src: string) => navigator.clipboard.writeText(`![](${src})`);
  const formatDate = (value: string | Date) => new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));

  return (
    <Paper sx={{ mx: "auto", flex: 1, p: 3, minWidth: { md: "600px", lg: "850px" } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{t("uploads.title")}</Typography><Divider />
      {uploadedImages.map((img) => {
        let ext: string;
        if (img.mime_type === "image/jpeg") {
          const match = img.original_name.match(/\.(jpe?g)$/i);
          ext = match ? match[1].toLowerCase() : "jpeg";
        } else ext = img.mime_type ? mimeToExt[img.mime_type] || "png" : "png";
        const src = `/uploads/${img.id}.${ext}`;
        return (
          <Box key={img.id}>
            <Box sx={{ display: "flex", alignItems: "center", my: 2, gap: 2 }}>
              <ZoomableContent><Box component="img" src={src} alt={img.original_name} sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }} /></ZoomableContent>
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography sx={{ flex: 1, wordBreak: "break-all" }}>{img.original_name}</Typography>
                <Typography sx={{ flex: 1 }}>{t("uploads.uploadedAt", { date: img.created_at ? formatDate(img.created_at) : "-" })}</Typography>
                <Typography sx={{ flex: 1 }}>{t("uploads.size", { size: img.size_bytes ?? 0 })}</Typography>
              </Box>
              <Button variant="outlined" onClick={() => handleCopy(src)}>{t("uploads.copyUrl")}</Button>
            </Box><Divider />
          </Box>
        );
      })}
    </Paper>
  );
};

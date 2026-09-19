import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { Box, Paper, Typography, Button, Avatar } from "@mui/material";
import { useUploadLocalAvatar } from "../../hooks/auth";
import { useNavigate } from "@tanstack/react-router";
import { accountSettingRoute } from "../../routes";
import { useNotify } from "../../hooks/useNotify";
import { useTranslation } from "react-i18next";

export const AvatarUpload = () => {
  const { t } = useTranslation("settings");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const localAvatarUpload = useUploadLocalAvatar();
  const { error } = useNotify();
  const navigate = useNavigate();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  const handleUpload = () => {
    if (!selectedFile) {
      error(t("avatarUpload.selectRequired"));
      return;
    }
    localAvatarUpload.mutate(selectedFile, {
      onSuccess: () => {
        navigate({ to: accountSettingRoute.to });
      },
    });
  };
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

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
      <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
        {t("avatarUpload.title")}
      </Typography>
      <Box
        onClick={() => fileInputRef.current?.click()}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          cursor: "pointer",
          p: 2,
          borderRadius: 1,
          transition: "background 0.2s",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Avatar
          src={previewUrl || undefined}
          alt="preview"
          sx={{
            width: 80,
            height: 80,
            bgcolor: "grey.200",
            border: "1px solid",
            borderColor: "divider",
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: "grey.700",
              color: "white",
              px: 2,
              py: 0.8,
              borderRadius: 1,
              fontSize: "0.875rem",
              fontWeight: "medium",
            }}
          >
            {t("avatarUpload.chooseFile")}
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: selectedFile ? "text.primary" : "text.secondary",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedFile ? selectedFile.name : t("avatarUpload.notSelected")}
          </Typography>
        </Box>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </Box>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          sx={{ mt: 4, px: 4, py: 1 }}
          onClick={handleUpload}
          disabled={localAvatarUpload.isPending || !selectedFile}
        >
          {localAvatarUpload.isPending
            ? t("avatarUpload.uploading")
            : t("avatarUpload.submit")}
        </Button>
        <Button
          variant="outlined"
          sx={{ mt: 4, px: 4, py: 1 }}
          onClick={() => navigate({ to: accountSettingRoute.to })}
        >
          {t("common.cancel")}
        </Button>
      </Box>
    </Paper>
  );
};

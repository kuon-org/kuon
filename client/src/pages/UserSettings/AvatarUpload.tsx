import { useRef, useState, useEffect } from "react";
import { Box, Paper, Typography, Button, Avatar } from "@mui/material";
import { useAuthQuery } from "../../hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { accountSettingRoute } from "../../router";
import { useNotify } from "../../hooks/useNotify";

export const AvatarUpload = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { localAvatarUpload, localAvatarUpload_isPending } = useAuthQuery();
  const { success, error } = useNotify();
  const navigate = useNavigate();
  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      error("ファイルを選択してください。");
      return;
    }
    localAvatarUpload(selectedFile);
  };
  const handleCancel = () => {
    navigate({ to: accountSettingRoute.to });
  };
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <Paper
      elevation={0} // お好みで調整
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
        プロフィール画像アップロード
      </Typography>

      {/* クリック領域全体 */}
      <Box
        onClick={handleBoxClick}
        sx={{
          display: "flex",
          alignItems: "center", // 垂直方向の中央揃え
          gap: 3,
          cursor: "pointer",
          p: 2,
          borderRadius: 1,
          transition: "background 0.2s",
          "&:hover": { bgcolor: "action.hover" }, // ホバー時に少し色を変える
        }}
      >
        <Avatar
          src={previewUrl || undefined}
          alt="preview"
          sx={{
            width: 80, // 少しサイズアップ
            height: 80,
            bgcolor: "grey.200",
            border: "1px solid",
            borderColor: "divider",
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* ボタン風のラベル */}
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
            ファイルを選択
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
            {selectedFile ? selectedFile.name : "選択されていません"}
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
          fullWidth={false}
          sx={{ mt: 4, px: 4, py: 1 }}
          onClick={handleUpload}
          disabled={localAvatarUpload_isPending || !selectedFile}
        >
          {localAvatarUpload_isPending
            ? "アップロード中..."
            : "新しい画像を送信する"}
        </Button>
        <Button
          variant="outlined"
          fullWidth={false}
          sx={{ mt: 4, px: 4, py: 1 }}
          onClick={handleCancel}
        >
          キャンセル
        </Button>
      </Box>
    </Paper>
  );
};

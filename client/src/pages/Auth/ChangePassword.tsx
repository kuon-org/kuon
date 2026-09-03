import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../../api/client";
import type { HttpError } from "../../api/FetchHttpClient";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.put<{ message: string }>("/password/change", {
        currentPassword,
        newPassword,
      });
      return data;
    },
    onSuccess: (data) => {
      setSuccess(true);
      setMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: HttpError<{ message?: string }>) => {
      setSuccess(false);
      setMessage(error.response?.data?.message ?? "パスワードの変更に失敗しました");
    },
  });

  const invalid =
    !currentPassword ||
    newPassword.length < 6 ||
    newPassword !== confirmPassword;

  return (
    <Paper
      sx={{
        mx: "auto",
        flex: 1,
        p: 3,
        minWidth: { xs: "100%", sm: "100%", md: "600px", lg: "850px" },
      }}
    >
      <Typography variant="h5" sx={{ mb: 1 }}>パスワード変更</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        ローカルアカウントの現在のパスワードを確認して、新しいパスワードへ変更します。
      </Typography>
      {message && <Alert severity={success ? "success" : "error"} sx={{ mb: 2 }}>{message}</Alert>}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="現在のパスワード"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          fullWidth
        />
        <TextField
          label="新しいパスワード"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          helperText={newPassword.length > 0 && newPassword.length < 6 ? "6文字以上必要です" : undefined}
          fullWidth
        />
        <TextField
          label="新しいパスワード（確認）"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={confirmPassword.length > 0 && newPassword !== confirmPassword}
          helperText={confirmPassword.length > 0 && newPassword !== confirmPassword ? "パスワードが一致しません" : undefined}
          fullWidth
        />
        <Button variant="contained" disabled={invalid || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <CircularProgress size={24} /> : "パスワードを変更"}
        </Button>
      </Box>
    </Paper>
  );
};

export default ChangePassword;

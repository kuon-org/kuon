import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Container, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { NavButton } from "../../components/common/NavButton";
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
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h5">パスワード変更</Typography>
        {message && <Alert severity={success ? "success" : "error"}>{message}</Alert>}
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
        <NavButton path="/settings/account" message="アカウント設定へ戻る" variant="outlined" fullWidth />
      </Box>
    </Container>
  );
};

export default ChangePassword;

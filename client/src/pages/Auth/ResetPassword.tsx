import { useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Container, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { NavButton } from "../../components/common/NavButton";
import apiClient from "../../api/client";
import type { ApiError } from "../../api/FetchHttpClient";
import { getApiErrorMessage } from "../../utils/errorHelpers";

const ResetPassword = () => {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string }>("/password-reset/reset", {
        token,
        newPassword: password,
      });
      return data;
    },
    onSuccess: (data) => {
      setCompleted(true);
      setMessage(data.message);
    },
    onError: (error: ApiError) => {
      setMessage(
        getApiErrorMessage(error, "パスワードの再設定に失敗しました", {
          PASSWORD_RESET_TOKEN_INVALID: "再設定URLが無効です",
          PASSWORD_RESET_TOKEN_EXPIRED: "再設定URLの有効期限が切れています",
        }),
      );
    },
  });

  const validationError =
    !token
      ? "再設定URLが無効です"
      : password.length > 0 && password.length < 6
        ? "パスワードは6文字以上必要です"
        : confirmPassword.length > 0 && password !== confirmPassword
          ? "確認用パスワードが一致しません"
          : null;

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h5">パスワード再設定</Typography>
        {message && <Alert severity={completed ? "success" : "error"}>{message}</Alert>}
        {!completed && (
          <>
            <TextField
              label="新しいパスワード"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              fullWidth
              error={!!validationError && password.length > 0}
            />
            <TextField
              label="新しいパスワード（確認）"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              fullWidth
              error={password !== confirmPassword && confirmPassword.length > 0}
              helperText={validationError}
            />
            <Button
              variant="contained"
              disabled={
                mutation.isPending ||
                !token ||
                password.length < 6 ||
                password !== confirmPassword
              }
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <CircularProgress size={24} /> : "パスワードを再設定"}
            </Button>
          </>
        )}
        <NavButton path="/login" message="ログイン画面へ" variant="outlined" fullWidth />
      </Box>
    </Container>
  );
};

export default ResetPassword;

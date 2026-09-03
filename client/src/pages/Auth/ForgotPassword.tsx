import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Container, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { NavButton } from "../../components/common/NavButton";
import apiClient from "../../api/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const status = useQuery({
    queryKey: ["passwordResetStatus"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ available: boolean }>("/password-reset/status");
      return data;
    },
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string }>("/password-reset/request", { email });
      return data;
    },
    onSuccess: (data) => setMessage(data.message),
    onError: () => setMessage("再設定メールの送信要求に失敗しました"),
  });

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h5">パスワードを忘れた場合</Typography>
        {status.data?.available === false ? (
          <Alert severity="info">このKuonではメールによるパスワード再設定を利用できません。</Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              ローカルアカウントに登録したメールアドレスを入力してください。
            </Typography>
            {message && <Alert severity="info">{message}</Alert>}
            <TextField
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              disabled={!email.trim() || mutation.isPending || status.isLoading}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <CircularProgress size={24} /> : "再設定メールを送信"}
            </Button>
          </>
        )}
        <NavButton path="/login" message="ログイン画面へ戻る" variant="outlined" fullWidth />
      </Box>
    </Container>
  );
};

export default ForgotPassword;

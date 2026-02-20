import { Button, TextField, Typography, Paper } from "@mui/material";
import { useState } from "react";
import { useAuthQuery } from "../../hooks/useAuth";

export const Login2FA = () => {
  const { loginVerify2FA, loginVerify2FA_isPending } = useAuthQuery();
  const [token, setToken] = useState("");
  const email = sessionStorage.getItem("pendingEmail");

  const handleVerify = () => {
    if (!email) {
      alert("メール情報が見つかりません。ログインをやり直してください。");
      return;
    }
    loginVerify2FA({ email, token });
  };

  return (
    <Paper
      sx={{
        mx: "auto",
        mt: 8,
        p: 4,
        maxWidth: "400px",
        textAlign: "center",
      }}
    >
      <Typography variant="h6" gutterBottom>
        二段階認証コードを入力
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Google Authenticator に表示された6桁のコードを入力してください。
      </Typography>

      <TextField
        fullWidth
        label="認証コード"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        inputProps={{ maxLength: 6, inputMode: "numeric" }}
        sx={{ mb: 3 }}
      />

      <Button
        variant="contained"
        fullWidth
        onClick={handleVerify}
        disabled={loginVerify2FA_isPending || token.length < 6}
      >
        認証する
      </Button>
    </Paper>
  );
};

import { Paper, Button, Box, Typography, TextField } from "@mui/material";
import { useState } from "react";
import { useAuthQuery } from "../../hooks/useAuth";

export const TwoFASetting = () => {
  const {
    user,
    setup2FA,
    setup2FA_isPending,
    setupVerify2FA,
    setupVerify2FA_isPending,
    delete2FA,
    delete2FA_isPending
  } = useAuthQuery();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [token, setToken] = useState("");

  const isEnabled = user?.is_2fa_enabled ?? false; // ← バックエンドから返すようにする

  const handleSetup = () => {
    setup2FA(undefined, {
      onSuccess: (data: any) => {
        setQrCode(data.qrCodeUrl);
      },
    });
  };

  const handleVerify = () => {
    setupVerify2FA(token, {
      onSuccess: () => {
        alert("二段階認証を有効化しました！");
        setQrCode(null);
        setToken("");
      },
    });
  };

    const handleDelete = () => {
      delete2FA();
    }


  return (
    <Paper
      sx={{
        mx: "auto",
        flex: 1,
        p: 3,
        minWidth: { md: "600px", lg: "850px" },
      }}
    >
      <Typography variant="h6" gutterBottom>
        二段階認証の設定
      </Typography>

      {/* ✅ 設定済み */}
      {isEnabled && !qrCode && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            二段階認証は現在 <b>有効</b> です。
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            新しい端末で設定したい場合は、一度無効化してください。
          </Typography>
          <Button color="error" variant="outlined" onClick={handleDelete} disabled={delete2FA_isPending}>
            無効化する
          </Button>
        </Box>
      )}

      {/* ✅ 未設定 or 設定中 */}
      {!isEnabled && (
        <>
          {!qrCode ? (
            <Button
              variant="contained"
              onClick={handleSetup}
              disabled={setup2FA_isPending}
            >
              二段階認証を有効化する
            </Button>
          ) : (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body1" gutterBottom>
                下のQRコードをGoogle Authenticatorでスキャンしてください
              </Typography>
              <Box
                component="img"
                src={qrCode}
                alt="2FA QR Code"
                sx={{ width: 200, height: 200, mx: "auto" }}
              />

              <Typography variant="body2" sx={{ mt: 3 }}>
                アプリに表示された6桁のコードを入力してください
              </Typography>
              <TextField
                label="認証コード"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                inputProps={{ maxLength: 6, inputMode: "numeric" }}
                sx={{ mt: 1, width: "200px" }}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleVerify}
                  disabled={setupVerify2FA_isPending || token.length < 6}
                >
                  登録する
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

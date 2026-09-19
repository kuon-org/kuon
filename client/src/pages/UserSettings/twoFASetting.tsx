import { Paper, Button, Box, Typography, TextField } from "@mui/material";
import { useState } from "react";
import {
  useAuthUserQuery,
  useDelete2FA,
  useSetup2FA,
  useVerifySetup2FA,
} from "../../hooks/auth";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const TwoFASetting = () => {
  const { t } = useTranslation("settings");
  const authUserQuery = useAuthUserQuery();
  const setup2FA = useSetup2FA();
  const verifySetup2FA = useVerifySetup2FA();
  const delete2FA = useDelete2FA();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const isEnabled = authUserQuery.data?.is_2fa_enabled ?? false;
  const handleSetup = () =>
    setup2FA.mutate(undefined, {
      onSuccess: (data: any) => setQrCode(data.qrCodeUrl),
    });
  const handleVerify = () =>
    verifySetup2FA.mutate(token, {
      onSuccess: () => {
        setQrCode(null);
        setToken("");
        navigate({ to: "/" });
      },
    });

  return (
    <Paper
      sx={{ mx: "auto", flex: 1, p: 3, minWidth: { md: "600px", lg: "850px" } }}
    >
      <Typography variant="h6" gutterBottom>
        {t("twoFactor.title")}
      </Typography>
      {isEnabled && !qrCode && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            {t("twoFactor.enabled")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("twoFactor.reconfigureHint")}
          </Typography>
          <Button
            color="error"
            variant="outlined"
            onClick={() => delete2FA.mutate()}
            disabled={delete2FA.isPending}
          >
            {t("twoFactor.disable")}
          </Button>
        </Box>
      )}
      {!isEnabled &&
        (!qrCode ? (
          <Button
            variant="contained"
            onClick={handleSetup}
            disabled={setup2FA.isPending}
          >
            {t("twoFactor.enable")}
          </Button>
        ) : (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body1" gutterBottom>
              {t("twoFactor.scanQr")}
            </Typography>
            <Box
              component="img"
              src={qrCode}
              alt="2FA QR Code"
              sx={{ width: 200, height: 200, mx: "auto" }}
            />
            <Typography variant="body2" sx={{ mt: 3 }}>
              {t("twoFactor.enterCode")}
            </Typography>
            <TextField
              label={t("twoFactor.code")}
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
                disabled={verifySetup2FA.isPending || token.length < 6}
              >
                {t("twoFactor.register")}
              </Button>
            </Box>
          </Box>
        ))}
    </Paper>
  );
};

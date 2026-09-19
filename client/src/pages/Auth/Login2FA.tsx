import { Box, Button, Paper, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import { useRef, useState } from "react";
import { useVerifyLogin2FA } from "../../hooks/auth";
import { useTranslation } from "react-i18next";
import { DevelopmentTotpHelper } from "../../components/layouts/Footer/DevelopmentTotpHelper";

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
`;

const blinkAnimation = keyframes`
  50% { opacity: 0; }
`;

export const Login2FA = () => {
  const { t } = useTranslation("auth");
  const [token, setToken] = useState("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const verifyMutation = useVerifyLogin2FA();

  const handleVerify = (value: string) => {
    if (value.length !== 6 || verifyMutation.isPending) return;
    verifyMutation.mutate(value, {
      onError: () => {
        setShake(true);
        setToken("");
        inputRef.current?.focus();
        setTimeout(() => setShake(false), 400);
      },
    });
  };

  const handleChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setToken(numericValue);
    if (numericValue.length === 6) handleVerify(numericValue);
  };

  return (
    <>
      <Paper
        sx={{ mx: "auto", mt: 8, p: 4, maxWidth: "400px", textAlign: "center" }}
      >
        <Typography variant="h6" gutterBottom>
          {t("twoFactor.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t("twoFactor.description")}
        </Typography>
        <input
          ref={inputRef}
          value={token}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
        <Box
          onClick={() => inputRef.current?.focus()}
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            mb: 3,
            cursor: "text",
            animation: shake ? `${shakeAnimation} 0.4s ease-in-out` : "none",
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => {
            const value = token[index];
            const isActive = isFocused && index === token.length;
            return (
              <div
                key={index}
                style={{
                  width: "48px",
                  height: "56px",
                  borderRadius: "10px",
                  border: `2px solid ${isActive ? "#1976d2" : "#ccc"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 500,
                  transition: "border-color 0.15s",
                }}
              >
                {value ??
                  (isActive && (
                    <Box
                      component="span"
                      sx={{
                        animation: `${blinkAnimation} 1s step-end infinite`,
                      }}
                    >
                      |
                    </Box>
                  ))}
              </div>
            );
          })}
        </Box>
        <Button
          variant="contained"
          fullWidth
          onClick={() => handleVerify(token)}
          disabled={verifyMutation.isPending || token.length < 6}
        >
          {t("twoFactor.submit")}
        </Button>
      </Paper>
      {import.meta.env.DEV && <DevelopmentTotpHelper />}
    </>
  );
};

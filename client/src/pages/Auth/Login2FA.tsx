import { Box, Button, Paper, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import { useRef, useState } from "react";
import { useAuthQuery } from "../../hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { useNotify } from "../../hooks/useNotify";
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
  const { loginVerify2FA, loginVerify2FA_isPending } = useAuthQuery();
  const [token, setToken] = useState("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { error } = useNotify();
  const email = sessionStorage.getItem("pendingEmail");
  const navigate = useNavigate();

  const handleVerify = (token: string) => {
    if (!email) {
      error("メール情報が見つかりません。ログインをやり直してください。");
      return;
    }

    loginVerify2FA(
      { email, token },
      {
        onSuccess: async () => {
          navigate({ to: "/" });
        },
        onError: () => {
          setShake(true);
          setToken("");

          inputRef.current?.focus();

          setTimeout(() => {
            setShake(false);
          }, 400);
        },
      },
    );
  };

  const handleChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setToken(numericValue);
    if (numericValue.length === 6) {
      handleVerify(numericValue);
    }
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

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Google Authenticator に表示された6桁のコードを入力してください。
      </Typography>

      {/* 実際の入力欄 */}
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

      {/* 6桁表示 */}
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
        disabled={loginVerify2FA_isPending || token.length < 6}
      >
        認証する
      </Button>
    </Paper>
  );
};

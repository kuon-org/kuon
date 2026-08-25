import { Box, Button, Paper, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useNotify } from "../../hooks/useNotify";
import apiClient from "../../api/client";
import type { HttpError } from "../../api/FetchHttpClient";
import type { AuthUser } from "../../hooks/useAuth";

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
  const [token, setToken] = useState("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { error, success } = useNotify();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: async (totpToken: string) => {
      const { data } = await apiClient.post("/login/verify-2fa", {
        token: totpToken,
      });
      return data;
    },
    onSuccess: async () => {
      const { data: user } = await apiClient.get<AuthUser>("/me");
      queryClient.setQueryData(["authUser"], user);
      sessionStorage.removeItem("pendingEmail");
      success("二段階認証が完了しました！");
      await navigate({ to: "/", replace: true });
    },
    onError: (err: HttpError) => {
      error(err.response?.data?.message || "認証コードが正しくありません");
      setShake(true);
      setToken("");
      inputRef.current?.focus();
      setTimeout(() => setShake(false), 400);
    },
  });

  const handleVerify = (value: string) => {
    if (value.length !== 6 || verifyMutation.isPending) return;
    verifyMutation.mutate(value);
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
        認証する
      </Button>
    </Paper>
  );
};

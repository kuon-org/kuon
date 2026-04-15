import React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Loading from "../../components/common/Loading/Loading";
import { useAuthQuery } from "../../hooks/useAuth";

import ComputerIcon from "@mui/icons-material/Computer";
import SmartphoneIcon from "@mui/icons-material/Smartphone";

const getDeviceIcon = (ua: string | null) => {
  if (!ua) return <ComputerIcon />;

  const lower = ua.toLowerCase();

  if (
    lower.includes("iphone") ||
    lower.includes("android") ||
    lower.includes("mobile")
  ) {
    return <SmartphoneIcon fontSize="small" />;
  }

  return <ComputerIcon fontSize="small" />;
};

export const Security = () => {
  const {
    sessionDevice,
    sessionDeviceIsLoading,
    logoutAll,
    logoutAllIsPending,
    logoutSession,
    logoutSessionIsPending,
  } = useAuthQuery();

  if (sessionDeviceIsLoading) return <Loading />;

  // 最終利用が新しい順
  const sorted = [...(sessionDevice ?? [])].sort(
    (a, b) =>
      new Date(b.last_used_at ?? 0).getTime() -
      new Date(a.last_used_at ?? 0).getTime(),
  );

  return (
    <Paper
      sx={{
        mx: "auto",
        flex: 1,
        p: 3,
        minWidth: { md: "600px", lg: "850px" },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">セキュリティ</Typography>

        <Button
          variant="outlined"
          color="error"
          onClick={() => logoutAll()}
          disabled={logoutAllIsPending}
        >
          すべてログアウト
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        {sorted.map((sd) => {
          return (
            <Paper key={sd.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={3} alignItems="center">
                {/* 左側：デバイスアイコンエリア */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.disabled",
                    flexShrink: 0,
                  }}
                >
                  {/* アイコンのサイズを大きくし、既存のfontSize設定を上書き */}
                  {React.cloneElement(getDeviceIcon(sd.user_agent), {
                    sx: { fontSize: 50 },
                    fontSize: "inherit",
                  })}
                </Box>

                {/* 右側：コンテンツエリア */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ flexGrow: 1 }}
                >
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography fontWeight="bold">
                        {sd.device_name ?? "不明なデバイス"}
                      </Typography>

                      {sd.is_current && (
                        <Chip
                          label="現在のセッション"
                          color="primary"
                          size="small"
                        />
                      )}
                    </Stack>

                    {sd.ip_address && (
                      <Typography variant="body2" color="text.secondary">
                        IP: {sd.ip_address}
                      </Typography>
                    )}

                    {sd.created_at && (
                      <Typography variant="body2" color="text.secondary">
                        作成: {new Date(sd.created_at).toLocaleString()}
                      </Typography>
                    )}

                    {sd.last_used_at && (
                      <Typography variant="body2" color="text.secondary">
                        最終利用: {new Date(sd.last_used_at).toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  {/* Tooltipの追加 */}
                  <Tooltip
                    title={
                      sd.is_current ? "現在のセッションは無効化できません" : ""
                    }
                    placement="top"
                    arrow
                  >
                    {/* disabled要素でもTooltipを反応させるためにspanでラップする */}
                    <span>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={logoutSessionIsPending || sd.is_current}
                        onClick={() => logoutSession(sd.id)}
                        sx={{ ml: 2, flexShrink: 0 }}
                      >
                        無効化
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
};

import { Box, Chip, Divider, Paper, Typography } from "@mui/material";
import { useAdminStatusQuery, useServerSettingsQuery } from "../../hooks/useAdmin";

const getBooleanSetting = (
  settings: { key: string; value: string }[] | undefined,
  key: string,
  defaultValue = false,
) => {
  const value = settings?.find((setting) => setting.key === key)?.value;
  if (value === undefined) return defaultValue;
  return value === "true";
};

interface StatusCardProps {
  title: string;
  description: string;
  enabled: boolean;
  enabledLabel: string;
  disabledLabel: string;
  warningWhenEnabled?: boolean;
}

const StatusCard = ({
  title,
  description,
  enabled,
  enabledLabel,
  disabledLabel,
  warningWhenEnabled = false,
}: StatusCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      minHeight: 150,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
      <Typography variant="h6">{title}</Typography>
      <Chip
        size="small"
        label={enabled ? enabledLabel : disabledLabel}
        color={warningWhenEnabled && enabled ? "warning" : enabled ? "success" : "default"}
        variant={enabled ? "filled" : "outlined"}
      />
    </Box>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Paper>
);

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const Dashboard = () => {
  const { settings, settings_isLoading } = useServerSettingsQuery();
  const { status, status_isLoading, status_isError } = useAdminStatusQuery();

  const maintenanceMode = getBooleanSetting(settings, "maintenance_mode");
  const requireAuthentication = getBooleanSetting(settings, "require_authentication");
  const notificationsEnabled = getBooleanSetting(settings, "notifications_enabled", true);
  const webhooksEnabled = getBooleanSetting(settings, "webhooks_enabled");
  const allowLocalAccountRegistration = getBooleanSetting(
    settings,
    "allow_local_account_registration",
    true,
  );

  return (
    <Box sx={{ width: "100%", maxWidth: 980 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        管理トップ
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Kuonインスタンスの主要な状態を確認できます。
      </Typography>

      {settings_isLoading ? (
        <Typography color="text.secondary">状態を取得しています...</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <StatusCard
            title="Maintenance"
            description="一般ユーザー向けコンテンツアクセスの停止状態です。"
            enabled={maintenanceMode}
            enabledLabel="メンテナンス中"
            disabledLabel="通常稼働"
            warningWhenEnabled
          />
          <StatusCard
            title="Authentication"
            description="未ログインユーザーにログインを要求する設定です。"
            enabled={requireAuthentication}
            enabledLabel="ログイン必須"
            disabledLabel="公開アクセス可"
          />
          <StatusCard
            title="Local registration"
            description="新しいローカルアカウントをユーザー自身が登録できるかを示します。"
            enabled={allowLocalAccountRegistration}
            enabledLabel="許可"
            disabledLabel="停止"
          />
          <StatusCard
            title="Notifications"
            description="インスタンス内通知の生成状態です。"
            enabled={notificationsEnabled}
            enabledLabel="有効"
            disabledLabel="無効"
          />
          <StatusCard
            title="Webhooks"
            description="インスタンス全体のWebhook配信状態です。"
            enabled={webhooksEnabled}
            enabledLabel="有効"
            disabledLabel="無効"
          />
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{ mt: 3, p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Runtime information
        </Typography>

        {status_isLoading && <Typography color="text.secondary">サーバ情報を取得しています...</Typography>}
        {status_isError && <Typography color="error">サーバ情報の取得に失敗しました。</Typography>}

        {status && (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">Uptime</Typography>
                <Typography>{formatUptime(status.uptimeSeconds)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Node.js</Typography>
                <Typography>{status.nodeVersion}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Database</Typography>
                <Typography>{status.database.status === "connected" ? "Connected" : "Error"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">PostgreSQL</Typography>
                <Typography sx={{ wordBreak: "break-word" }}>{status.database.postgresVersion ?? "Unknown"}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Environment variables
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {status.environment.map((item) => (
                <Box
                  key={item.key}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}
                >
                  <Box>
                    <Typography component="span" sx={{ fontFamily: "monospace" }}>{item.key}</Typography>
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      Environment Variable
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={item.configured ? "設定済み" : "未設定"}
                    color={item.configured ? "success" : "default"}
                    variant={item.configured ? "filled" : "outlined"}
                  />
                </Box>
              ))}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

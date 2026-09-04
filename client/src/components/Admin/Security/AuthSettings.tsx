import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { AuthSettingForm } from "./AuthSettingForm";
import { OIDCManager } from "./OIDCManager";
import { SAMLManager } from "./SAMLManager";
import { useAdminQuery } from "../../../hooks/useAdmin";

export const AuthSettings = () => {
  const [mainTab, setMainTab] = useState(0);
  const [oauthTab, setOauthTab] = useState(0);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const {
    allIdps,
    cleanupIdpRegistry,
    cleanupIdpRegistry_isPending,
  } = useAdminQuery();

  const orphanProviders = allIdps?.filter((provider) => provider.orphaned) ?? [];

  const handleMainTabChange = (
    _event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setMainTab(newValue);
  };

  const handleOauthTabChange = (
    _event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setOauthTab(newValue);
  };

  const handleCleanup = async (providerName: string) => {
    setCleanupError(null);
    try {
      await cleanupIdpRegistry(providerName);
    } catch (error) {
      setCleanupError(
        error instanceof Error ? error.message : "IdPのクリーンアップに失敗しました",
      );
    }
  };

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3 }}>
        認証機構設定
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Tabs value={mainTab} onChange={handleMainTabChange}>
        <Tab label="ID/Pass" sx={{ minHeight: 44 }} />
        <Tab label="LDAP" sx={{ minHeight: 44 }} />
        <Tab label="SAML" sx={{ minHeight: 44 }} />
        <Tab label="OIDC" sx={{ minHeight: 44 }} />
        <Tab label="OAuth2" sx={{ minHeight: 44 }} />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {mainTab === 0 && <Typography>ID/Pass 設定フォーム ※準備中</Typography>}
        {mainTab === 1 && <Typography>LDAP 設定フォーム ※準備中</Typography>}
        {mainTab === 2 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                SAML 2.0 プロバイダを設定します。
              </Typography>
              <SAMLManager />
            </Box>
          </Box>
        )}
        {mainTab === 3 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              汎用 OpenID Connect プロバイダを設定します。
            </Typography>
            <OIDCManager />
          </Box>
        )}

        {mainTab === 4 && (
          <>
            <Tabs
              value={oauthTab}
              onChange={handleOauthTabChange}
              sx={{ mb: 1 }}
            >
              <Tab label="Discord" />
              <Tab label="Twitter" />
              <Tab label="GitHub" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {oauthTab === 0 && <AuthSettingForm provider_name="discord" />}
              {oauthTab === 1 && <AuthSettingForm provider_name="twitter" />}
              {oauthTab === 2 && <AuthSettingForm provider_name="github" />}
            </Box>
          </>
        )}
      </Box>

      {orphanProviders.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            未使用IdP Registry
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ENVやDB設定が存在しないIdPマスタです。ユーザーIdentityから参照されていないものだけ削除できます。
          </Typography>
          {cleanupError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cleanupError}
            </Alert>
          )}
          <Stack spacing={1}>
            {orphanProviders.map((provider) => (
              <Alert
                key={provider.provider_name}
                severity={provider.canCleanup ? "warning" : "info"}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    disabled={!provider.canCleanup || cleanupIdpRegistry_isPending}
                    onClick={() => handleCleanup(provider.provider_name)}
                  >
                    クリーンアップ
                  </Button>
                }
              >
                <strong>{provider.provider_name}</strong> ({provider.provider_type})
                {provider.userIdentityCount > 0
                  ? ` — ${provider.userIdentityCount}件のユーザーIdentityから参照されているため削除できません。`
                  : " — ENVまたはDB設定を外した後に残った未使用マスタです。"}
              </Alert>
            ))}
          </Stack>
        </Box>
      )}
    </>
  );
};
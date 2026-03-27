import { Divider, Tab, Tabs, Typography, Box } from "@mui/material";
import { useState } from "react";
import { AuthSettingForm } from "./AuthSettingForm";
import { OIDCManager } from "./OIDCManager";
import { SAMLManager } from "./SAMLManager";

export const AuthSettings = () => {
  const [mainTab, setMainTab] = useState(0);
  const [oauthTab, setOauthTab] = useState(0);

  const handleMainTabChange = (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setMainTab(newValue);
  };

  const handleOauthTabChange = (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setOauthTab(newValue);
  };

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3 }}>
        認証機構設定
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* メインタブ */}
      <Tabs value={mainTab} onChange={handleMainTabChange}>
        <Tab label="ID/Pass" sx={{ minHeight: 44 }} />
        <Tab label="LDAP" sx={{ minHeight: 44 }} />
        <Tab label="SAML" sx={{ minHeight: 44 }} />
        <Tab label="OIDC" sx={{ minHeight: 44 }} />
        <Tab label="OAuth2" sx={{ minHeight: 44 }} />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {mainTab === 0 && <Typography>ID/Pass 設定フォーム</Typography>}
        {mainTab === 1 && <Typography>LDAP 設定フォーム</Typography>}
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

        {/* OAuth2の場合だけネストタブ */}
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
              <Tab label="Custom" />
              {/* 必要に応じて追加 */}
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {oauthTab === 0 && <AuthSettingForm provider_name="discord" />}
              {oauthTab === 1 && <AuthSettingForm provider_name="twitter" />}
              {oauthTab === 2 && <AuthSettingForm provider_name="github" />}
              {oauthTab === 3 && (
                <Typography>その他OAuth2 用設定フォーム</Typography>
              )}
            </Box>
          </>
        )}
      </Box>
    </>
  );
};

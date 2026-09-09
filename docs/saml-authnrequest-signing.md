# SAML AuthnRequest Signing

KuonはSAML Service Provider (SP) からIdentity Provider (IdP)へ送信するAuthnRequestの署名に対応しています。

署名はIdP単位で有効化できます。未設定または `false` の場合は従来どおり未署名のAuthnRequestを送信するため、既存設定との互換性があります。

## 管理画面 / DB設定

SAML IdPのAdvanced Settingsで `Sign AuthnRequest` を有効にし、以下を設定します。

- `SP Private Key`: AuthnRequest署名用の秘密鍵 (PEM)
- `SP Public Certificate`: 上記秘密鍵に対応するX.509証明書 (PEM)
- `Signature Algorithm`: `sha256` / `sha512` / `sha1`
- `Digest Algorithm`: `sha256` / `sha512` / `sha1`

DB管理の `private_key` はAES-256-GCMで暗号化して保存され、管理API / 管理画面へ平文では返却されません。
暗号化鍵は `IDP_SECRET_ENCRYPTION_KEY` を利用し、未設定時はKuonのJWT secretをフォールバックとして利用します。本番環境では `IDP_SECRET_ENCRYPTION_KEY` を明示的に設定することを推奨します。

秘密鍵をローテーションする場合は、新しい秘密鍵と対応する公開証明書を保存してください。秘密鍵欄を空欄のまま保存した場合、既存の秘密鍵を維持します。

## ENV設定

```env
KUON_IDP__company_sso__PROVIDER_NAME=saml-company
KUON_IDP__company_sso__DISPLAY_NAME="Company SSO"
KUON_IDP__company_sso__PROVIDER_TYPE=SAML
KUON_IDP__company_sso__ISSUER=https://kuon.example.com
KUON_IDP__company_sso__ENTRY_POINT=https://idp.example.com/saml/sso
KUON_IDP__company_sso__CERT="-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----"

KUON_IDP__company_sso__SIGN_AUTHN_REQUEST=true
KUON_IDP__company_sso__PRIVATE_KEY="-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----"
KUON_IDP__company_sso__PUBLIC_CERT="-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----"
KUON_IDP__company_sso__SIGNATURE_ALGORITHM=sha256
KUON_IDP__company_sso__DIGEST_ALGORITHM=sha256
```

`SIGN_AUTHN_REQUEST` は `true` / `false` のBooleanとして解析されます。
ENVの秘密鍵はDBへ保存されず、実行時にのみ利用されます。管理APIでは `private_key` は `[REDACTED]` として扱われます。

未署名で利用する場合は以下の設定を省略するか、明示的に無効化します。

```env
KUON_IDP__company_sso__SIGN_AUTHN_REQUEST=false
```

## SP Metadata

SAML IdPごとに以下のURLでKuonのSP Metadataを取得できます。

```text
/auth/<provider_name>/metadata
```

例:

```text
https://kuon.example.com/auth/saml-company/metadata
```

AuthnRequest署名が有効な場合、MetadataにはSPの公開証明書が含まれます。IdP側へMetadataをインポートすることで、Kuonが送信する署名付きAuthnRequestの検証に利用できます。

## Keycloak

KeycloakのSAML Clientでは、Kuon側の署名設定を有効にした上で `Client signature required` をONにできます。

推奨構成例:

```text
Kuon
  Sign AuthnRequest: ON
  Signature Algorithm: SHA-256
  Digest Algorithm: SHA-256
  SP Private Key: configured
  SP Public Certificate: configured

Keycloak
  Client signature required: ON
  Sign documents / assertions: deployment policyに合わせて設定
```

KeycloakへKuonのSP Metadataをインポートするか、KuonのSP公開証明書をClientの署名検証用証明書として登録してください。

## 注意事項

- 秘密鍵をログへ出力しないでください。
- Docker / KubernetesでENVを利用する場合はSecrets機能の利用を推奨します。
- `sha1` は互換性用途のみとし、通常は `sha256` 以上を利用してください。
- `private_key` と `public_cert` は対応する鍵ペアである必要があります。

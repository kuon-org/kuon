# Environment Configuration

Kuonの管理設定は、DB / 管理画面に加えて環境変数から宣言的に構成できます。
Docker Compose、Kubernetes、IaCなどで設定をコードとして管理したいセルフホスト環境を想定しています。

## 基本ルール

環境変数が定義されている設定はDBより優先されます。

```text
Environment > Database
```

ENV管理の設定は管理画面では `Source: Environment` と表示され、読み取り専用になります。

ENVとDBの両方に同じ設定がある場合でも、DBの値は上書き・削除しません。ENVを削除してKuonを再起動すると、既存のDB設定が再び利用されます。

## Server Settings

`server_settings` の主要設定は `KUON_SETTING_*` で上書きできます。

```env
KUON_SETTING_ALLOW_API_KEY=false
KUON_SETTING_ALLOW_LOCAL_ACCOUNT_REGISTRATION=true
KUON_SETTING_EMAIL_VERIFICATION_POLICY=required
KUON_SETTING_REQUIRE_TOTP_FOR_EXTERNAL_IDP=false
KUON_SETTING_REQUIRE_AUTHENTICATION=true
KUON_SETTING_MAINTENANCE_MODE=false
KUON_SETTING_WEBHOOKS_ENABLED=false
KUON_SETTING_ALLOW_USER_WEBHOOKS=false
KUON_SETTING_NOTIFICATIONS_ENABLED=true
```

Boolean値は `true` / `false` のみ指定できます。

`KUON_SETTING_EMAIL_VERIFICATION_POLICY` は現在 `disabled` / `required` を指定できます。

ENVで管理されているキーは管理画面から変更・削除できません。

## SMTP

SMTP設定は以下の環境変数を利用できます。

```env
KUON_SMTP_HOST=mail.example.com
KUON_SMTP_PORT=587
KUON_SMTP_SECURE=false
KUON_SMTP_USERNAME=kuon
KUON_SMTP_PASSWORD=change-me
KUON_SMTP_FROM_ADDRESS=kuon@example.com
KUON_SMTP_FROM_NAME=Kuon
```

`KUON_SMTP_PORT` は1〜65535の整数、`KUON_SMTP_SECURE` は `true` / `false` を指定します。

SMTP関連の環境変数が1つでも定義されている場合、SMTP設定全体を管理画面ではENV管理の読み取り専用設定として扱います。未定義フィールドについてはDB設定へフォールバックします。

`KUON_SMTP_PASSWORD` は実行時のみ利用され、管理API・管理画面へ平文で返しません。

## Identity Providers

### 命名規則

複数のIdPを定義するため、二重アンダースコアを利用します。

```text
KUON_IDP__<key>__<FIELD>
```

`<key>` はENV内で各IdPをグループ化するための識別子です。実際のKuon上のProvider名は `PROVIDER_NAME` で指定します。

例:

```env
KUON_IDP__github__PROVIDER_NAME=github
KUON_IDP__github__DISPLAY_NAME=GitHub
KUON_IDP__github__PROVIDER_TYPE=OAUTH2
```

### IdPメタデータ

以下のフィールドは `identity_providers` 相当のメタデータとして扱います。

```text
PROVIDER_NAME
DISPLAY_NAME
PROVIDER_TYPE
DESCRIPTION
LOGO_URL
BUTTON_COLOR
TEXT_COLOR
IS_ACTIVE
CONFIG_JSON
```

`PROVIDER_NAME` を省略した場合は `<key>` をProvider名として利用します。
`DISPLAY_NAME` を省略した場合は `PROVIDER_NAME` を利用します。
`PROVIDER_TYPE` を省略した場合は `OIDC` になります。
`IS_ACTIVE` は省略時 `true` です。

それ以外のフィールドはIdPの `config` として扱います。

通常はENV名を小文字化したキーになります。

```text
CLIENT_ID      -> client_id
CLIENT_SECRET  -> client_secret
AUTH_URL       -> auth_url
TOKEN_URL      -> token_url
USER_INFO_URL  -> user_info_url
ISSUER_HOST    -> issuer_host
ENTRY_POINT    -> entry_point
CERT           -> cert
```

### OAuth2の例

```env
KUON_IDP__github__PROVIDER_NAME=github
KUON_IDP__github__DISPLAY_NAME=GitHub
KUON_IDP__github__PROVIDER_TYPE=OAUTH2
KUON_IDP__github__CLIENT_ID=client-id
KUON_IDP__github__CLIENT_SECRET=client-secret
KUON_IDP__github__AUTH_URL=https://github.com/login/oauth/authorize
KUON_IDP__github__TOKEN_URL=https://github.com/login/oauth/access_token
KUON_IDP__github__USER_INFO_URL=https://api.github.com/user
KUON_IDP__github__SCOPE="read:user user:email"
KUON_IDP__github__MAPPING='{"id":"id","username":"login","display_name":"name"}'
```

### OIDCの例

```env
KUON_IDP__company_sso__PROVIDER_NAME=oidc-company
KUON_IDP__company_sso__DISPLAY_NAME="Company SSO"
KUON_IDP__company_sso__PROVIDER_TYPE=OIDC
KUON_IDP__company_sso__ISSUER_HOST=https://id.example.com
KUON_IDP__company_sso__CLIENT_ID=kuon
KUON_IDP__company_sso__CLIENT_SECRET=client-secret
KUON_IDP__company_sso__SCOPE="openid profile email"
KUON_IDP__company_sso__MAPPING='{"id":"sub","username":"preferred_username","display_name":"name"}'
```

### SAMLの例

KeycloakをローカルIdPとして利用する例です。

```env
KUON_IDP__keycloak__PROVIDER_NAME=saml-keycloak
KUON_IDP__keycloak__DISPLAY_NAME=Keycloak
KUON_IDP__keycloak__PROVIDER_TYPE=SAML
KUON_IDP__keycloak__ISSUER=kuon
KUON_IDP__keycloak__ENTRY_POINT=http://localhost:8080/realms/kuon/protocol/saml
KUON_IDP__keycloak__CERT="..."
KUON_IDP__keycloak__WANT_ASSERTIONS_SIGNED=true
KUON_IDP__keycloak__WANT_AUTHN_RESPONSE_SIGNED=false
KUON_IDP__keycloak__DISABLE_REQUESTED_AUTHN_CONTEXT=false
KUON_IDP__keycloak__CLOCK_SKEW_SECONDS=0
KUON_IDP__keycloak__REQUEST_ID_EXPIRATION_MS=28800000
KUON_IDP__keycloak__MAPPING='{"id":"nameID","username":"email","display_name":"displayName"}'
```

`CERT` にはIdPがSAML Assertion / Responseの署名に使用する公開証明書を設定します。KeycloakではRealmの署名証明書、またはSAML metadataの `KeyDescriptor use="signing"` に含まれる証明書を利用してください。

現在のKuonはSPから送信するSAML AuthnRequest自体の署名には対応していません。そのためKeycloakで検証する場合は `Client signature required = OFF` とし、IdP側ではAssertion署名を有効にする構成を推奨します。AuthnRequest署名対応は別途実装予定です。

### SAMLの型付きフィールド

ENVは本来すべて文字列ですが、一部のSAML設定は実行時にBoolean / Integerが必要です。
Kuonは以下の既知フィールドのみ型変換します。

Boolean:

```text
WANT_ASSERTIONS_SIGNED          -> wantAssertionsSigned
WANT_AUTHN_RESPONSE_SIGNED      -> wantAuthnResponseSigned
DISABLE_REQUESTED_AUTHN_CONTEXT -> disableRequestedAuthnContext
```

Integer:

```text
CLOCK_SKEW_SECONDS        -> clockSkewSeconds
REQUEST_ID_EXPIRATION_MS  -> requestIdExpirationMs
```

Boolean値は `true` / `false` のみ、Integer値は整数のみ指定できます。不正な値の場合は、秘密値を含めず環境変数名を示す設定エラーになります。

`CLIENT_ID=12345` のように数字だけで構成される可能性がある通常フィールドは文字列のまま保持されます。

### MAPPING

`MAPPING` はJSON Objectとして解析されます。

```env
KUON_IDP__keycloak__MAPPING='{"id":"nameID","username":"email","display_name":"displayName"}'
```

SAMLの場合は、`username` や `display_name` が参照する属性をIdP側のSAML Assertionにも含める必要があります。
例えば上記のKeycloak例では `email` と `displayName` をProtocol Mapperで返すように設定します。

### CONFIG_JSON

複雑なIdP設定は `CONFIG_JSON` でまとめて指定できます。

```env
KUON_IDP__company_sso__CONFIG_JSON='{"issuer_host":"https://id.example.com","client_id":"kuon","client_secret":"secret","scope":"openid profile email","mapping":{"id":"sub","username":"preferred_username","display_name":"name"}}'
```

個別フィールドと `CONFIG_JSON` を同時に指定した場合は個別フィールドが優先されます。

```text
CONFIG_JSON < KUON_IDP__<key>__<FIELD>
```

### Callback / Redirect URI

`REDIRECT_URI` を明示しなかった場合、Kuonは以下の形式で自動生成します。

```text
${APP_SITE_URL ?? BACKEND_URL ?? "http://localhost:3000"}/auth/${provider_name}/callback
```

例えば:

```env
KUON_IDP__keycloak__PROVIDER_NAME=saml-keycloak
```

かつ `APP_SITE_URL=http://localhost:3000` の場合:

```text
http://localhost:3000/auth/saml-keycloak/callback
```

明示的に上書きする場合は以下を指定できます。

```env
KUON_IDP__keycloak__REDIRECT_URI=https://kuon.example.com/auth/saml-keycloak/callback
```

IdP側のACS / Redirect URIにも同じURLを設定してください。

### ENVとDBに同じIdPがある場合

同じ `provider_name` がENVとDBの両方に存在する場合、実行時はENV定義を利用します。
DB上のIdP設定は変更しません。

```text
ENV IdP
   ↓ shadows
DB IdP
```

ENV定義を削除してKuonを再起動すると、DB定義が存在する場合はその設定が再び利用されます。

### ENV-only IdPとIdentity Provider Registry

`user_identities.provider_id` の参照整合性を保つため、ENVだけで定義されたIdPでも `identity_providers` に秘密値を含まない最小限のProviderマスタを作成します。

ENVから供給された接続設定・Client Secret・Certificateなどは `idp_configurations` へ保存しません。

ENV定義を削除しても、`identity_providers` と既存の `user_identities` は自動削除しません。ENVは「現在有効な設定」を管理し、永続的なIdentityのライフサイクルまでは管理しないためです。

ENV削除後に次の条件をすべて満たしたProviderは、管理画面の `未使用IdP Registry` からクリーンアップできます。

```text
ENV設定なし
DB設定なし
user_identities参照なし
```

ユーザーIdentityから参照されているProviderは削除できません。

### IdP疎通確認

管理画面からENV / DBどちらのIdPも疎通確認できます。

現在の確認内容はProvider Typeごとに以下です。

- OIDC: Discovery endpointと必要なmetadata
- OAuth2: Authorization / Token / User Info endpointへの到達性
- SAML: SSO endpointへの到達性と必須設定

疎通確認はネットワーク到達性と基本設定を確認するためのもので、実際のユーザーログインフロー全体を保証するものではありません。

秘密値そのものは疎通確認レスポンスへ含めません。

## Secrets

以下のような秘密値は管理API / UI / ログへ平文で露出させません。

```text
CLIENT_SECRET
SMTP_PASSWORD
CERT
PASSWORD
TOKEN
その他credential相当の値
```

管理画面からENV IdPを参照した場合、秘密値は `[REDACTED]` として表示されます。

環境変数自体の管理にはDocker Secrets、Kubernetes Secrets、各IaC基盤のSecret管理機能などを利用してください。

## Docker Composeの例

```yaml
services:
  kuon:
    environment:
      KUON_SETTING_REQUIRE_AUTHENTICATION: "true"
      KUON_SETTING_ALLOW_LOCAL_ACCOUNT_REGISTRATION: "false"

      KUON_SMTP_HOST: mail.example.com
      KUON_SMTP_PORT: "587"
      KUON_SMTP_SECURE: "false"
      KUON_SMTP_FROM_ADDRESS: kuon@example.com

      KUON_IDP__company__PROVIDER_NAME: oidc-company
      KUON_IDP__company__DISPLAY_NAME: Company SSO
      KUON_IDP__company__PROVIDER_TYPE: OIDC
      KUON_IDP__company__ISSUER_HOST: https://id.example.com
      KUON_IDP__company__CLIENT_ID: kuon
      KUON_IDP__company__CLIENT_SECRET: ${KUON_OIDC_CLIENT_SECRET}
      KUON_IDP__company__MAPPING: '{"id":"sub","username":"preferred_username","display_name":"name"}'
```

Compose YAMLではBooleanや数値に見える値も、Kuonへ環境変数として渡すことを明確にするため引用符で囲むことを推奨します。

## Webhookについて

`KUON_WEBHOOK__<key>__<FIELD>` 形式へ拡張できる共通ENV parserの基盤はありますが、Webhook設定自体のENV対応は現時点では対象外です。Webhookのテンプレート、イベント購読、Custom JSONなどを含めて別途対応します。

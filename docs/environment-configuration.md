# Environment Configuration

Kuonの管理設定は、DB / 管理画面に加えて環境変数から宣言的に構成できます。

環境変数が定義されている項目はDBより優先され、管理画面では `Source: Environment` の読み取り専用設定として表示されます。

```text
Environment > Database
```

環境変数を削除してKuonを再起動すると、既存のDB設定へフォールバックします。

## Server Settings

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

Boolean値は `true` / `false` を指定してください。

## SMTP

```env
KUON_SMTP_HOST=mail.example.com
KUON_SMTP_PORT=587
KUON_SMTP_SECURE=false
KUON_SMTP_USERNAME=kuon
KUON_SMTP_PASSWORD=change-me
KUON_SMTP_FROM_ADDRESS=kuon@example.com
KUON_SMTP_FROM_NAME=Kuon
```

SMTP関連の環境変数が1つでも定義されている場合、SMTP設定全体を管理画面では読み取り専用として扱います。未定義フィールドはDB設定へフォールバックします。

`KUON_SMTP_PASSWORD` の値は管理API・管理画面へ返しません。

## Identity Providers

複数件定義できる設定は、二重アンダースコアで識別子を囲みます。

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

OIDCの例:

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

`PROVIDER_NAME`, `DISPLAY_NAME`, `PROVIDER_TYPE`, `DESCRIPTION`, `LOGO_URL`, `BUTTON_COLOR`, `TEXT_COLOR`, `IS_ACTIVE` はIdP本体のメタデータとして扱います。それ以外のフィールドは小文字化してIdPの `config` として扱います。

複雑な設定は `CONFIG_JSON` でまとめて指定できます。

```env
KUON_IDP__company_sso__CONFIG_JSON='{"issuer_host":"https://id.example.com","client_id":"kuon","client_secret":"secret","scope":"openid profile email","mapping":{"id":"sub","username":"preferred_username","display_name":"name"}}'
```

個別フィールドと `CONFIG_JSON` を同時に指定した場合は個別フィールドが優先されます。

ENVとDBに同じ `provider_name` が存在する場合、実行時はENV定義を利用し、既存DB設定は変更しません。ENV定義を削除して再起動するとDB定義が再び利用されます。

ENVのみで定義されたIdPでは、`user_identities.provider_id` の参照先を維持するため、秘密値を含まない `identity_providers` の親レコードだけをDBへ作成します。IdP接続設定や秘密値はDBへ保存しません。

## Secrets

以下のような秘密値は管理API / UI / ログへ平文で露出させないでください。

- `CLIENT_SECRET`
- `KUON_SMTP_PASSWORD`
- token / password / credentialを含む設定

環境変数自体の管理にはDocker Secrets、Kubernetes Secrets、各IaC基盤のSecret管理機能などを利用してください。

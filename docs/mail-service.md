# MailService

Kuonからメールを送信する場合は、各ドメインからSMTPへ直接接続せず、`server/src/services/mailService.ts`の共通`mailService`を利用します。

## SMTP設定

管理画面の「サーバ設定 > SMTP / Mail」から以下を設定できます。

- SMTP Host
- SMTP Port
- Implicit TLS / SMTPS
- Username
- Password
- From Address
- From Name

Passwordは保存時にAES-256-GCMで暗号化され、APIレスポンスや管理画面へ平文で再表示されません。暗号化鍵は`SMTP_SECRET_ENCRYPTION_KEY`が設定されていればその値を利用し、未設定時は既存の`JWT_SECRET`を鍵素材として利用します。

保存済みPasswordを維持する場合は、管理画面のPassword欄を空欄のまま保存します。

## MailServiceの利用

```ts
import { mailService } from "../services/mailService.js";

if (await mailService.isConfigured()) {
  await mailService.send({
    to: "user@example.com",
    subject: "Example",
    text: "Mail body",
  });
}
```

SMTP未設定でもKuon本体は動作します。メールが必須ではない機能では`mailService.isConfigured()`を確認し、SMTP未設定を理由に本来の処理を失敗させないようにしてください。

Email VerificationやPassword Resetなど、メール送信自体が機能要件となる場合はSMTP設定済みであることを事前条件として扱います。

## TLS

- `secure = true`の場合は接続開始時からImplicit TLS / SMTPSを利用します。
- `secure = false`の場合でも、SMTPサーバがSTARTTLSを広告していれば自動的にTLSへ昇格します。
- Usernameを利用するSMTP AUTHでは、TLSが確立できない接続へ認証情報を送信しません。

## Test Mail

管理画面から任意の宛先へSMTPテストメールを送信できます。テストメール送信に成功すると`mail.test.sent`、失敗すると`mail.send.failed`がServer Eventsへ記録されます。

## Secret / Logging

以下をログ、Event metadata、APIレスポンスへ含めないでください。

- SMTP Password
- Authorization情報
- メール本文に含まれる機密情報
- 将来追加するVerification / Reset Token

各機能からSMTPソケットやSMTP設定を直接扱わず、共通`MailService`を経由してください。

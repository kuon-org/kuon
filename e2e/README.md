# Kuon E2E tests

Playwrightを利用したKuonのE2Eテストです。

## Permission E2E

`tests/permissions.spec.ts`ではRole / Permission認可基盤について、以下を確認します。

- General: 自分のコンテンツ操作と他ユーザーのコンテンツに対する拒否
- Readonly: 閲覧のみ許可され、記事作成・コメント投稿が拒否されること
- Moderator: 他ユーザーのコンテンツ管理とシステム管理APIの拒否
- カスタムRole: 指定したPermissionだけが有効になること
- 複数Role: Permissionが和集合になり、Role解除後にPermissionが消えること
- 権限昇格防止: 自分が持たないPermissionをRoleへ付与できないこと
- 最後のAdmin: 最後のAdminは降格できず、Adminが2人なら片方を降格できること

UI表示が重要な箇所はブラウザで確認し、認可境界はAPIを直接呼び出してHTTP statusも検証します。

## Client Hook regression E2E

`tests/client-hooks.spec.ts`ではClient Hook / TanStack Query構成の回帰を確認します。

- 記事一覧を表示しただけでは`/api/stocks/mylists?articleId=...`を発火しないこと
- Client Hook移行で影響範囲の大きかった主要画面がruntime errorなく表示できること
- User Settings / Admin Settings / Webhook / Server EventsなどのQuery Hookが画面mount時に正常に動作すること

Hookの内部実装そのものではなく、実際にブラウザから画面を開いたときのimport解決やQuery mountを含めて確認する回帰テストです。

## 実行前提

Kuonのclient/serverを起動した状態で実行します。Playwrightの既定baseURLは`http://localhost:5050`です。

E2EからRoleを操作するため、2FAが無効なAdminアカウントを環境変数で指定してください。

```powershell
$env:KUON_E2E_ADMIN_IDENTIFIER="admin"
$env:KUON_E2E_ADMIN_PASSWORD="password"
pnpm test:e2e
```

別URLを利用する場合は`PLAYWRIGHT_BASE_URL`を指定できます。

```powershell
$env:PLAYWRIGHT_BASE_URL="http://localhost:5050"
pnpm test:e2e
```

テスト用の一般ユーザーとカスタムRoleは実行ごとに一意な名前で作成します。

### Scenario 7について

最後のAdminのロックアウト防止テストは、テスト開始時点でAdmin Roleを持つユーザーが1人だけの場合に実行されます。複数Adminが存在する環境では、そのシナリオのみskipします。

ローカルの完全新規DBでリリース前確認を行う場合は、最初に作成したAdminアカウントだけがAdminである状態で実行すると7シナリオすべて確認できます。

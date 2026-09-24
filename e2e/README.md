# Kuon E2E tests

Playwrightを利用したKuonのE2Eテストです。網羅的なUIテストではなく、リリース前に主要機能が実際に利用できることを確認するスモークE2Eを中心にしています。

## テスト構成

- `auth.spec.ts`: ローカル登録、ログイン失敗/成功、`/me`、refresh、logout
- `articles.spec.ts`: 記事作成、Markdown表示、編集、論理削除、復元
- `comments.spec.ts`: コメント、返信、論理削除後のツリー維持
- `tags.spec.ts`: タグ作成、記事への付与、フォロー切替、管理者による編集
- `social.spec.ts`: デフォルトStock追加/解除、ユーザーフォロー/解除
- `navigation.spec.ts`: Top、記事詳細、検索、ユーザーページの主要遷移
- `admin.spec.ts`: Admin API/画面の基本導線と一般ユーザーの拒否
- `permissions.spec.ts`: Role / Permission認可境界
- `maintenance.spec.ts`: メンテナンスモードの遮断/解除
- `backup-restore.spec.ts`: Backup export / Restore（破壊的なため明示指定時のみ）
- `client-hooks.spec.ts`: Client Hook / TanStack Query構成の回帰

共通の登録・ログイン・記事生成は `helpers/` にまとめています。

## 実行前提

Kuonのclient/serverを起動した状態で実行します。Playwrightの既定baseURLは`http://localhost:5050`です。

Role、Tag、Admin、Maintenance、Backup / Restoreを確認するため、2FAが無効なAdminアカウントを指定してください。

```powershell
$env:KUON_E2E_ADMIN_IDENTIFIER="admin"
$env:KUON_E2E_ADMIN_PASSWORD="password"
```

別URLを利用する場合は以下を指定できます。

```powershell
$env:PLAYWRIGHT_BASE_URL="http://localhost:5050"
```

## 通常のE2E

全specを実行します。

```powershell
pnpm test:e2e
```

## PR / develop向けSmoke E2E

Backup / RestoreやMaintenanceのような環境状態を大きく変更するテストを除き、主要導線を実行します。

```powershell
pnpm test:e2e:smoke
```

対象は認証、記事、コメント、タグ、Stock / Follow、主要遷移、Admin、Permissionです。

## リリース前E2E

リリース前には以下を実行します。

```powershell
$env:KUON_E2E_DESTRUCTIVE="true"
pnpm test:e2e:release
```

`KUON_E2E_DESTRUCTIVE=true` の場合、Backup / Restoreテストが実際にRestoreを実行します。**必ずE2E専用または破棄可能な環境で実行してください。** Restore後はセッションが無効化されるため、他の作業者が利用している環境では実行しないでください。

`maintenance_mode` が環境変数で固定されている場合、Maintenanceテストは設定を書き換えられないためskipします。

## Permission E2E

`tests/permissions.spec.ts`では以下を確認します。

- General: 自分のコンテンツ操作と他ユーザーのコンテンツに対する拒否
- Readonly: 閲覧のみ許可され、記事作成・コメント投稿が拒否されること
- Moderator: 他ユーザーのコンテンツ管理とシステム管理APIの拒否
- カスタムRole: 指定したPermissionだけが有効になること
- 複数Role: Permissionが和集合になり、Role解除後にPermissionが消えること
- 権限昇格防止: 自分が持たないPermissionをRoleへ付与できないこと
- 最後のAdmin: 最後のAdminは降格できず、Adminが2人なら片方を降格できること

UI表示が重要な箇所はブラウザで確認し、認可境界はAPIを直接呼び出してHTTP statusも検証します。

最後のAdminのロックアウト防止テストは、テスト開始時点でAdmin Roleを持つユーザーが1人だけの場合に実行されます。複数Adminが存在する環境では、そのシナリオのみskipします。

## Client Hook regression E2E

Client Hook regressionだけを実行する場合は以下です。

```powershell
pnpm --filter @kuon/e2e exec playwright test tests/client-hooks.spec.ts
```

テストユーザー・記事・タグなどは実行ごとに一意な値を生成し、可能な限り既存データへ依存しないようにしています。

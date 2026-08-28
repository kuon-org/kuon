# 開発環境

このドキュメントでは、Kuonをローカルで開発するための環境構築方法と、基本的な開発手順を説明します。

現在はWindows環境での開発を主な対象としています。

---

## 前提環境

以下のツールを利用します。

- Git
- mise
- Docker Desktop

Node.jsとpnpmは個別にインストールせず、プロジェクトの`mise.toml`で管理します。

現在のプロジェクトではNode.js 24系とpnpm 11系を使用します。`package.json`にも対応するバージョン範囲が定義されています。

```text
mise.toml
  ├── Node.js 24
  └── pnpm latest

package.json
  ├── Node.js >=24 <25
  └── pnpm >=11 <12
```

pnpmのプロジェクトバージョンは`package.json`の`packageManager`で`pnpm@11.21.0`として固定されています。

---

# 1. リポジトリをcloneする

GitHubからリポジトリをcloneします。

```powershell
git clone <repository-url>
cd kuon
```

---

# 2. miseをセットアップする

miseをインストールし、Kuonのリポジトリで有効にします。

miseを利用することで、Kuonが必要とするNode.jsやpnpmのバージョンをプロジェクト単位で揃えられます。

リポジトリのルートで以下を実行します。

```powershell
mise install
```

インストール後、Node.jsとpnpmのバージョンを確認します。

```powershell
node --version
pnpm --version
```

期待するバージョンはNode.js 24系、pnpm 11系です。

miseのshimsがPATHに入っていない場合は、miseの案内に従ってshimsをPATHへ追加してください。

---

# 3. 依存関係をインストールする

リポジトリのルートで実行します。

```powershell
pnpm install
```

Kuonはpnpm workspaceとして構成されているため、ルートからClientとServerの依存関係をまとめてインストールできます。

---

# 4. 開発用データベースを起動する

KuonのServerはPostgreSQLを利用します。

開発用データベースはDockerで起動します。

Docker関連の設定はリポジトリ内の現在の構成を確認して利用してください。

初回のPostgreSQLコンテナ作成時には、`database/migrations/docker-entrypoint-initdb.d/`以下のSQLが自動的に実行され、必要なデータベーススキーマが作成されます。

データベース構成の詳細については、[Database](./database.md)を参照してください。

---

# 5. 環境変数を設定する

ServerやClientの起動に必要な環境変数を設定します。

環境変数の具体的な内容は、リポジトリ内の`.env.example`や各パッケージの設定を確認してください。

特にServerでは、PostgreSQLへの接続情報や認証関連の設定などが必要になります。

秘密情報を含む`.env`ファイルはGitへコミットしないでください。

---

# 6. Prismaを同期する

KuonではSQLをデータベーススキーマのSource of Truthとして扱います。

データベースのスキーマが変更された場合は、PostgreSQLへ変更を反映した後に以下を実行します。

```powershell
pnpm prisma db pull
pnpm prisma generate
```

これにより、PostgreSQLのスキーマをPrisma Schemaへ反映し、Prisma Clientを再生成します。

基本的な流れは以下です。

```text
SQL
 ↓
PostgreSQL
 ↓
prisma db pull
 ↓
Prisma Schema
 ↓
prisma generate
 ↓
Prisma Client
```

データベースの変更方法については、[Architecture](./architecture.md)および今後追加するDatabaseドキュメントを参照してください。

---

# 7. 開発サーバーを起動する

ClientとServerをまとめて起動する場合は、リポジトリルートで以下を実行します。

```powershell
pnpm dev
```

個別に起動することもできます。

```powershell
pnpm dev:client
pnpm dev:server
```

---

# 開発時の主なコマンド

## 開発サーバー

```powershell
pnpm dev
pnpm dev:client
pnpm dev:server
```

## ビルド

```powershell
pnpm build
pnpm build:client
pnpm build:server
```

## Lint / Typecheck

```powershell
pnpm lint
pnpm typecheck
pnpm check
```

`pnpm check`ではLintとTypecheckの両方を実行します。

## フォーマット

```powershell
pnpm format
```

---

# データベース開発

データベースに変更を加える場合は、SQLを先に変更します。

```text
SQLを変更
   ↓
PostgreSQLへ反映
   ↓
prisma db pull
   ↓
prisma generate
   ↓
Serverの型・コードを更新
```

既存のデータベースに対してアプリケーションの更新時に適用する変更は、ServerのMigration Runnerで管理します。

```text
server/migration/
       ↓
Express起動時に実行
       ↓
kuon_migrations
```

データベースの初期化とアプリケーションマイグレーションは役割が異なるため、混同しないようにしてください。

---

# Git / ブランチ運用

Issueに対応する場合は、Issue番号を含めたブランチを作成します。

例:

```text
feature/server/issue-17
feature/client/issue-17
fix/server/issue-XX
```

基本的にはIssueごとにブランチを作成し、Pull Requestを通して変更を`develop`へ取り込みます。

```text
Issue
  ↓
feature/.../issue-XX
  ↓
実装
  ↓
Pull Request
  ↓
Review
  ↓
developへMerge
```

Pull Requestには、必要に応じて開発ログを記録します。

PR本文の以下の領域に記載した内容は、マージ時に自動投稿される運用になっています。

```html
<!-- DEVELOPMENT_LOG_START -->

<!-- DEVELOPMENT_LOG_END -->
```

---

# 共通サービス / ミドルウェアの利用

Kuonでは、複数のドメインから利用する機能を`server/src/services/`や`server/src/middlewares/`へ共通化しています。

新しい機能を実装する際は、同じ責務を独自実装する前に既存のService / Middlewareが利用できないか確認してください。

特に、イベントログ、通知、Permission、Runtime Maintenanceなどはアプリケーション全体で挙動を統一するための共通基盤です。

## 基本方針

多くの共通Serviceはsingleton instanceをexportしています。

```ts
export const someService = new SomeService();
```

利用側では原則として新しいinstanceを生成せず、exportされているinstanceをimportして利用します。

```ts
import { someService } from "../services/someService.js";
```

Repositoryを直接利用する必要がない場合は、Serviceを経由してください。Service側に設定確認、通知、重複排除、ログ記録などのドメインルールが含まれている場合があります。

---

## EventLogger

実装:

```text
server/src/services/eventLogger.ts
```

Backup / Restore / Migration / Webhookなど、サーバ内部で発生した運用上重要なイベントを`server_events`へ記録するために利用します。

通常のdebug logやすべてのrequestを保存する目的ではありません。

### 利用例

```ts
import { eventLogger } from "../services/eventLogger.js";

await eventLogger.info("example.completed", {
  source: "example",
  message: "Example operation completed",
  actorUserId: userId,
  ipAddress: req.ip,
  metadata: {
    targetId,
    durationMs,
  },
});
```

Levelは以下を利用できます。

```ts
eventLogger.info(...);
eventLogger.warning(...);
eventLogger.error(...);
```

`eventType`は、既存イベントと同様に`resource.action`形式を基本とします。

```text
backup.started
backup.completed
backup.failed
webhook.failed
runtime_maintenance.enabled
```

### EventLoggerの注意事項

EventLogger内部でDB保存に失敗しても、元の処理を失敗させない設計になっています。

ただし、以下の情報はイベントへ保存しないでください。

- Password
- Access / Refresh Token
- Client Secret
- Cookie
- Authorization Header
- API Key
- その他のCredential

`metadata`、`before`、`after`は機密情報らしいkeyを自動的に`[REDACTED]`へ置換しますが、自動マスクだけに依存せず、呼び出し側でも不要な秘密情報を渡さないでください。

特に外部APIのエラー全文、URL Query、HTTP Header、認証レスポンスなどをそのままmetadataへ保存しないようにします。

将来Audit Log用途で利用する場合に備えて、以下のcontextも指定できます。

```ts
await eventLogger.info("resource.updated", {
  category: "audit",
  source: "example",
  message: "Resource updated",
  actorUserId: userId,
  subjectType: "resource",
  subjectId: resourceId,
  before: beforeValue,
  after: afterValue,
  correlationId,
});
```

現時点ではServer Eventsは主に`category: "system"`を利用します。

---

## NotificationService

実装:

```text
server/src/services/notificationService.ts
```

Kuon内通知を生成する場合に利用します。

通知機能の有効 / 無効、ユーザーごとの通知設定、重複排除、SSEへの更新通知などがService内部で処理されるため、通常は`notificationRepository`や`notificationStreamService`を機能側から直接呼び出さないでください。

現在は以下のようなdomain event向けメソッドが用意されています。

```ts
notificationService.userFollowed(followerUserId, followeeUserId);
notificationService.commentCreated(commentId, actorUserId);
notificationService.articlePublished(articleId, actorUserId);
```

### 利用例

```ts
import { notificationService } from "../services/notificationService.js";

await notificationService.commentCreated(comment.id, req.user.userId);
```

新しい通知を追加する場合は、呼び出し側で直接notification recordを組み立てるのではなく、`NotificationType`とNotificationServiceのdomain methodを追加することを基本とします。

```text
Domain処理
   ↓
NotificationService
   ├── Server Settings確認
   ├── User Preferences確認
   ├── Recipient決定
   ├── Notification保存
   └── SSE更新通知
```

通知生成に失敗したことで本来の投稿・コメント・フォロー操作まで失敗させるべきかどうかも、既存Serviceの挙動に合わせて判断してください。

---

## Permission / requirePermission

Permission定義:

```text
server/src/constants/permissions.ts
```

Route Middleware:

```text
server/src/middlewares/permission.ts
```

APIをPermissionで保護する場合は、role名を直接判定せず`requirePermission`を利用します。

### 利用例

```ts
import { Permissions } from "../constants/permissions.js";
import { requirePermission } from "../middlewares/permission.js";

router.get(
  "/admin/example",
  requirePermission(Permissions.System.SettingsManage),
  controller.list,
);
```

Permissionはrole名ではなく操作能力を表すSource of Truthです。

以下のようなrole名による分岐は追加しないでください。

```ts
// NG
if (user.role === "admin") {
  // ...
}
```

新しいPermissionを追加する場合は、`Permissions`だけでなく以下も確認します。

- `permissionDefinitions`
- Permission dependency (`requires`)
- Preset Role
- `adminAccessPermissions`（管理画面へのアクセスが必要な場合）
- Client側のPermissionによる表示制御
- Server API側のPermission enforcement

Client側の非表示はUXのための制御であり、セキュリティ境界は必ずServer側に置いてください。

---

## RuntimeMaintenanceService

実装:

```text
server/src/services/runtimeMaintenanceService.ts
```

Restoreなど、処理中にDBや永続データへアクセスさせたくない短時間の操作で利用するprocess-localなRuntime Maintenance lockです。

永続的なメンテナンス設定とは目的が異なります。

### 利用例

```ts
import { runtimeMaintenanceService } from "../services/runtimeMaintenanceService.js";

runtimeMaintenanceService.lock("restore");

try {
  await restoreDatabase();
} finally {
  runtimeMaintenanceService.unlock();
}
```

lock中は`runtimeMaintenanceGate`によってDBや永続データへ触れる主要経路が503になります。

`unlock()`は必ず`finally`で実行し、例外発生時にKuonがRuntime Maintenance状態へ残らないようにしてください。

また、このlockはServer processのmemory上にのみ存在するため、再起動をまたぐ状態管理や複数Server instance間の同期用途には使用できません。

---

## 共通サービスを追加したとき

新しい共通Service / Middlewareを追加し、今後別機能から再利用することが想定される場合は、このドキュメントにも以下を追記してください。

- 何のための機能か
- 実装ファイル
- どこから利用するか
- 最小の利用例
- 呼び出し側が守るべきルール
- 利用してはいけないケース

コード上にServiceが存在するだけでは、新しい開発者が存在や利用方法を把握しにくいため、再利用を意図した共通基盤はdeveloper documentationもAPIの一部として扱います。

---

# 開発時の基本方針

- Node.jsやpnpmのバージョンはプロジェクトの`mise.toml`を基準にする
- 依存関係はpnpmで管理する
- データベーススキーマはSQLを正として管理する
- SQLを変更したら必要に応じて`prisma db pull`と`prisma generate`を実行する
- 秘密情報をGitへコミットしない
- Issueに対応する変更はIssue番号を含むブランチで作業する
- 変更はPull Requestを通して`develop`へ取り込む
- 共通Service / Middlewareが存在する処理は独自実装せず、既存の共通基盤を優先して利用する
- 再利用を意図した共通基盤を追加した場合は`docs/development.md`へ利用方法を追記する

---

# トラブルシューティング

## `node`や`pnpm`のバージョンが違う

まずmiseが正しく適用されているか確認します。

```powershell
mise current
node --version
pnpm --version
```

miseのshimsがPATHに存在しない場合は、miseの案内に従ってPATHを修正します。

## `prisma db pull`が接続エラーになる

PostgreSQLが起動しているか確認してください。

```text
Client / Server
      ↓
PostgreSQL
```

Serverを起動する前に、開発用データベースが利用可能な状態になっている必要があります。

## DBを初期状態から作り直したい

PostgreSQLのDockerコンテナとボリュームを削除して再作成すると、初回起動時のSQLが再実行されます。

ただし、開発中のデータも削除されるため、必要なデータがある場合は事前にバックアップしてください。

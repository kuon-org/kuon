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

# 開発時の基本方針

- Node.jsやpnpmのバージョンはプロジェクトの`mise.toml`を基準にする
- 依存関係はpnpmで管理する
- データベーススキーマはSQLを正として管理する
- SQLを変更したら必要に応じて`prisma db pull`と`prisma generate`を実行する
- 秘密情報をGitへコミットしない
- Issueに対応する変更はIssue番号を含むブランチで作業する
- 変更はPull Requestを通して`develop`へ取り込む

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

# アーキテクチャ

## 概要

Kuonは、Reactによるクライアント、Expressによるサーバー、PostgreSQLによるデータベースで構成されたセルフホスト型のナレッジ共有アプリケーションです。

```text
┌─────────────────────────────┐
│          Client             │
│                             │
│ React + TypeScript + MUI    │
│ TanStack Router / Query     │
└──────────────┬──────────────┘
               │ HTTP
               ▼
┌─────────────────────────────┐
│          Server             │
│                             │
│ Express + TypeScript        │
│                             │
│ Routes                      │
│   ↓                         │
│ Controllers                 │
│   ↓                         │
│ Services                    │
│   ↓                         │
│ Repositories                │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│         PostgreSQL          │
│                             │
│         knowledge.*         │
└─────────────────────────────┘
```

リポジトリはpnpm workspaceとして構成され、主に`client`と`server`の2つのアプリケーションと、データベース関連のファイルを管理しています。

---

## リポジトリ構成

```text
kuon/
├── client/          # Reactフロントエンド
├── server/          # Expressバックエンド
├── database/        # PostgreSQLのスキーマ・初期化・マイグレーション
├── .github/         # GitHub Actionsなどのリポジトリ設定
├── .devcontainer/   # 開発コンテナ設定
├── mise.toml        # 開発ツールのバージョン管理
├── package.json     # workspace全体の設定
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

### Client

`client`はReact + TypeScript + Viteで構成されたフロントエンドです。

主な技術要素は以下です。

- React
- TypeScript
- Material UI
- TanStack Router
- TanStack Query
- Redux Toolkit
- React Markdown
- Mermaid

Clientは主に以下を担当します。

- UIの表示
- ユーザー操作の受付
- クライアント側のルーティング
- APIとの通信
- クライアント側の状態管理

### Server

`server`はExpress 5 + TypeScriptで構成されたバックエンドです。

主な責務は以下です。

- REST API
- 認証・認可
- ユーザー管理
- 記事管理
- コメント・タグ・ストックなどの管理
- 外部IdP認証
- 管理者向け機能
- サーバー設定
- ファイル・画像処理
- OGP / Shareページ生成
- データベースアクセス
- データベースマイグレーション

Expressの起動処理は`server/src/index.ts`を起点とします。サーバー起動時には、データベースのマイグレーションや初期化処理などを行った後にHTTPサーバーを起動します。

---

# Serverのアーキテクチャ

Serverでは、基本的に以下の依存方向を意識します。

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Prisma
  ↓
PostgreSQL
```

## Routes

RoutesはHTTPエンドポイントを定義し、必要なMiddlewareを適用したうえでControllerへ処理を委譲します。

```text
server/src/routes/
├── usersRoutes.ts
├── articlesRoutes.ts
├── authRouter.ts
├── idpRouter.ts
├── commentsRouter.ts
├── adminRouter.ts
└── ...
```

基本的には以下を担当します。

- HTTPエンドポイントの定義
- Middlewareの適用
- Controllerと必要な依存関係の接続
- Controllerへの処理委譲

Route自身に複雑なビジネスロジックを記述することは避けます。

## Controllers

ControllerはHTTPレイヤーの処理を担当します。

主な責務は以下です。

- Requestからパラメータを取得する
- Request Bodyを取得する
- Serviceを呼び出す
- HTTP Responseを返す

ビジネスロジックや直接的なデータベースアクセスは、基本的にControllerには記述しません。

## Services

Serviceはアプリケーションのビジネスロジックを担当します。

例:

```text
services/
├── usersService.ts
├── serverSettingsService.ts
├── uploadImagesService.ts
└── ...
```

ServiceはRepositoryや他のServiceに依存する場合があります。

Serviceが大きくなり、複数の独立した責務を持つようになった場合は、責務ごとに分割することを検討します。

## Repositories

Repositoryは永続化処理とデータベースアクセスを担当します。

```text
Service
  ↓
Repository
  ↓
Prisma
  ↓
PostgreSQL
```

ControllerやServiceから直接Prismaを操作するのではなく、基本的にはRepositoryを経由してデータベースへアクセスします。

---

# 認証

認証はServer側で管理し、Middlewareを利用して認証が必要なエンドポイントを保護します。

現在の認証関連機能には以下があります。

- ローカル認証
- JWTベースの認証
- Cookieを利用したセッション管理
- API Key認証
- 二要素認証
- 外部IdP認証

認証方式に依存する処理は、個々のビジネスロジックからできるだけ分離します。

---

# 外部IdP

Kuonは外部Identity Provider（IdP）を利用した認証に対応しています。

概念的には以下のような流れになります。

```text
Client
  ↓
Server
  ↓
Identity Provider
  ↓
Authentication Callback
  ↓
Kuon User / Session
```

IdP固有の処理は、通常のユーザー管理処理からできるだけ分離して管理します。

---

# サーバー設定

サーバー全体に関わる設定はデータベースで管理します。

```text
PostgreSQL
    ↓
ServerSettingsRepository
    ↓
ServerSettingsService
    ↓
Application
```

`ServerSettingsService`をアプリケーションからサーバー設定へアクセスするための窓口とします。

頻繁に参照される設定については、リクエストごとにデータベースへアクセスするのではなく、Server起動時に読み込んだ値をメモリ上に保持します。

データベースはサーバー設定のSource of Truthです。

管理者が変更可能なサーバー設定を追加する場合は、個別に環境変数などを追加するのではなく、基本的にはServer Settingsの仕組みを利用します。

---

# データベース

KuonではPostgreSQLを利用します。

アプリケーション用のテーブルは`knowledge`スキーマに配置します。

```text
PostgreSQL
└── knowledge
    ├── users
    ├── articles
    ├── comments
    ├── tags
    ├── server_settings
    └── ...
```

## SQLをスキーマの正とする

データベーススキーマは、Prisma Migrateを中心に管理するのではなく、SQLを正として管理します。

基本的な関係は以下です。

```text
SQL
 ↓
PostgreSQL
 ↓
prisma db pull
 ↓
Prisma Schema
 ↓
Prisma Client
```

Prismaは主にアプリケーションからデータベースへ型安全にアクセスするために利用します。

## データベース初期化

PostgreSQLのDockerコンテナを初めて作成するときは、`database/migrations/docker-entrypoint-initdb.d/`以下のSQLがPostgreSQLによって自動実行されます。

この処理によって、新規データベースに必要なスキーマやテーブルを作成します。

## アプリケーションマイグレーション

既に存在するデータベースへ後から変更を適用する場合は、Server側のMigration Runnerを利用します。

```text
Server起動
      ↓
migrationRunner
      ↓
server/migration/
      ↓
kuon_migrations
      ↓
SQL実行
```

適用済みのマイグレーションは`kuon_migrations`テーブルで管理します。

これにより、データベースコンテナを作り直すことなく、Kuonのバージョンアップ時に必要なデータベース変更を適用できます。

---

# Prisma

Prismaはデータベースアクセスレイヤーとして利用します。

スキーマ変更時の基本的な流れは以下です。

```text
1. SQLを変更
      ↓
2. PostgreSQLへSQLを適用
      ↓
3. prisma db pull
      ↓
4. Prisma Schemaを更新
      ↓
5. prisma generate
      ↓
6. 更新されたPrisma Clientを利用
```

そのため、SQL側のスキーマとPrisma Schemaの内容は常に同期させます。

---

# ClientとServerの境界

ClientとServerはHTTP APIを通じて通信します。

```text
React
  ↓
HTTP API
  ↓
Express
  ↓
Service
```

ClientはServer内部の実装詳細に依存しません。

例えばClientから以下のものを直接参照することはありません。

- Prisma Model
- Repository
- PostgreSQLのテーブル構造
- Server内部のService実装

ClientとServerの間ではHTTP APIが境界となります。

---

# 管理機能

管理者向けの機能は通常のユーザー向け機能とは分離して提供します。

```text
Client
└── Admin
    ↓
Server Admin Routes
    ↓
Admin Services
    ↓
Database
```

管理機能の例:

- サーバー設定
- API Keyの利用可否設定
- Webhookなどのサーバー機能設定
- その他のサーバー全体に関わる設定

サーバー全体の設定は、Clientから直接データベースを操作するのではなく、Server Settingsを通して変更します。

---

# 設計上の方針

## 責務を分離する

1つのServiceやControllerに無関係な処理を集約しすぎないようにします。

複数の独立した責務を持つようになった場合は、責務ごとに分割することを検討します。

## Controllerを薄く保つ

ControllerはHTTPに関する処理を中心に担当し、ビジネスロジックはServiceへ配置します。

## データベースアクセスを分離する

アプリケーションコードからPostgreSQLへアクセスするときは、基本的にRepositoryを経由します。

## PostgreSQLをスキーマの正とする

データベーススキーマの変更はSQLを中心に行い、`prisma db pull`によってPrisma Schemaへ反映します。

## サーバー設定はServiceを窓口にする

アプリケーションからServer Settingsを利用するときは、設定テーブルを直接参照せず`ServerSettingsService`を利用します。

## ClientとServerを疎結合にする

ClientはServerの内部実装ではなく、HTTP APIを契約として利用します。

---

# 今後のアーキテクチャについて

現在のKuonは、比較的シンプルなExpressアプリケーションとして構成されています。

今後コードベースが大きくなった場合には、以下のような改善を検討します。

- 大きくなったServiceの責務分割
- Dependency Injectionの整理
- 認証処理のさらなる分離
- Client / Server間の型共有
- Controller / Module構造の整理
- 必要に応じたServerフレームワークの再検討

これらは現時点で採用を決定しているものではありません。

現在の設計方針を維持しつつ、コードベースの規模や開発チームの状況に応じて段階的に改善していきます。

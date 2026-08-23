# コントリビューションガイド

Kuonへの変更を行う際の基本的な開発ルールをまとめています。

開発環境の構築方法については、[Development Guide](docs/development.md)を参照してください。

アーキテクチャについては、[Architecture](docs/architecture.md)を参照してください。

---

## 開発の基本フロー

基本的にはIssueを起点として開発を進めます。

```text
Issue
  ↓
ブランチ作成
  ↓
実装
  ↓
Pull Request
  ↓
Review
  ↓
developへMerge
```

小さな修正であっても、後から変更理由を追跡できるよう、可能な限りIssueやPull Requestに記録を残します。

---

## ブランチ

Issueに対応する場合は、Issue番号を含めたブランチを作成します。

### Server

```text
feature/server/issue-17
fix/server/issue-XX
```

### Client

```text
feature/client/issue-17
fix/client/issue-XX
```

機能追加は`feature/`、バグ修正は`fix/`を基本とします。

その他、機能追加やバグ修正に明確に分類されないメンテナンス作業には`chore/`など、変更内容に適したプレフィックスを使用します。

ブランチ名には可能な限りIssue番号を含めます。

---

## Commit

コミットメッセージには、変更の種類が分かるプレフィックスを使用します。

基本的にはConventional Commitsの形式に従います。

```text
feat: 新しい機能を追加
fix: バグを修正
refactor: 動作を変えずにコードを改善
docs: ドキュメントを変更
test: テストを追加・変更
chore: ビルドや依存関係などのメンテナンス
```

例:

```text
feat: add server settings API
fix: fix API key authentication
refactor: split users service
chore: update dependencies
docs: add architecture guide
```

1つのコミットには、可能な限り関連する変更だけを含めます。

---

## Pull Request

変更を`develop`へ取り込む場合はPull Requestを作成します。

Pull Requestでは、少なくとも以下が分かるようにします。

- 何を変更したか
- なぜ変更したか
- どのように確認したか
- 関連するIssue

### Pull Requestテンプレート

リポジトリに用意されているPull Requestテンプレートを利用してください。

Issueを解決するPull Requestでは、可能な限りIssueとの関連付けを行います。

例:

```text
Closes #17
```

---

## Development Log

Pull Requestには開発ログを記録できます。

以下の領域に記載した内容は、Pull Requestのマージ時に自動投稿される運用になっています。

```html
<!-- DEVELOPMENT_LOG_START -->

ここに開発ログを書く

<!-- DEVELOPMENT_LOG_END -->
```

開発中に行った調査、設計上の判断、試行錯誤など、後から振り返ると役立つ情報を必要に応じて記録してください。

---

## コードを書くときの方針

Kuonでは、処理の責務をできるだけ分離します。

### Controller

ControllerはHTTPレイヤーの処理を担当します。

- Requestから値を取得する
- Serviceを呼び出す
- HTTP Responseを返す

ビジネスロジックをControllerへ集約しないようにします。

### Service

Serviceはアプリケーションやビジネスロジックを担当します。

1つのServiceに複数の独立した責務が集まりすぎた場合は、責務ごとの分割を検討します。

### Repository

Repositoryはデータベースへのアクセスを担当します。

基本的にControllerやServiceから直接Prismaを操作せず、Repositoryを経由してデータベースへアクセスします。

詳細は[Architecture](docs/architecture.md)を参照してください。

---

## データベース変更

データベーススキーマを変更する場合は、SQLをSource of Truthとして扱います。

基本的な流れは以下です。

```text
SQLを変更
   ↓
PostgreSQLへ反映
   ↓
prisma db pull
   ↓
prisma generate
   ↓
コードを更新
```

既存のデータベースに対してバージョンアップ時に適用する変更は、ServerのMigration Runnerで管理します。

```text
server/migration/
       ↓
Express起動時に実行
       ↓
kuon_migrations
```

DB変更を含むPull Requestでは、以下の整合性を確認してください。

- SQLの変更内容
- 必要なMigrationの追加
- Prisma Schemaの更新
- Prisma Clientの再生成
- 既存データへの影響

詳細は今後追加するDatabaseドキュメントを参照してください。

---

## Client / Serverの境界

ClientはServerの内部実装に直接依存しません。

```text
Client
  ↓
HTTP API
  ↓
Server
  ↓
Database
```

Clientから以下のようなServer内部の実装を直接参照する設計は避けます。

- Prisma Model
- Repository
- PostgreSQLのテーブル構造
- Server内部のService

ClientとServerの間ではHTTP APIを境界として扱います。

---

## 設定・秘密情報

秘密情報をリポジトリへコミットしないでください。

特に以下のような情報には注意してください。

- パスワード
- API Key
- JWT Secret
- OAuth / OIDC Secret
- データベース接続情報
- その他の認証情報

開発環境では`.env`などのローカル設定を利用し、Git管理対象には秘密情報を含めないようにします。

---

## Pull Requestを出す前のチェック

最低限、以下を確認してください。

- [ ] Issueとの関連付けを確認した
- [ ] ブランチ名にIssue番号を含めた
- [ ] Commit messageが適切な形式になっている
- [ ] 不要な変更が含まれていない
- [ ] Lintが通る
- [ ] Typecheckが通る
- [ ] 必要に応じてテストを実行した
- [ ] DB変更がある場合、SQL / Migration / Prisma Schemaの整合性を確認した
- [ ] 秘密情報をコミットしていない
- [ ] Pull Requestの説明を記載した

ローカルでは以下のコマンドを利用できます。

```powershell
pnpm check
pnpm build
```

---

## ドキュメントの更新

設計や開発手順に影響する変更を行った場合は、関連するドキュメントも更新してください。

```text
README.md
  ↓
プロジェクト概要

docs/architecture.md
  ↓
システム構成・設計

docs/development.md
  ↓
開発環境・開発手順

CONTRIBUTING.md
  ↓
開発ルール・コントリビューション方法
```

「実装とドキュメントの内容が異なる」状態をできるだけ避けます。

---

## AIツールの利用について

AIによるコード生成・レビュー・調査などの利用は制限しません。

ただし、AIが生成したコードについても、最終的な内容の確認と動作確認は変更者が行ってください。

AIを利用した場合でも、Pull Requestの内容や変更の責任は変更者が持つものとします。

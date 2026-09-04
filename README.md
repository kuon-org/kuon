# Kuon

**Kuon** is a self-hosted knowledge sharing platform for teams and communities.

> 🚧 Kuon is currently under active development.

## Demo

実際に動作しているKuonのデモサイトを公開しています。

**[🌐 Demo Site](https://demo.kuon.f5.si/)**

---

## Features

現在実装・開発中の主な機能です。

- 📝 Markdownによる記事・ナレッジ共有
- 💬 コメント
- 🏷️ タグ
- ⭐ ストック
- 🔐 ローカル認証 / 二要素認証
- 🔑 API Key
- 🔗 外部IdP認証（OIDCなど）
- ⚙️ 管理画面 / サーバー設定
- 🖼️ アバター・画像関連機能
- 🌐 OGP / Shareページ

機能は今後も追加・変更される予定です。

---

## Tech Stack

### Client

- React
- TypeScript
- Vite
- Material UI
- TanStack Router
- TanStack Query
- Redux Toolkit

### Server

- Node.js
- TypeScript
- Express
- Prisma

### Database / Infrastructure

- PostgreSQL
- Docker
- pnpm
- mise

---

## Repository Structure

```text
kuon/
├── client/          # React frontend
├── server/          # Express backend
├── database/        # Database initialization and migrations
├── docs/            # Project documentation
├── .github/         # GitHub Actions and repository settings
├── mise.toml        # Development tool versions
├── package.json     # Workspace configuration
└── pnpm-workspace.yaml
```

---

## Development

Kuonは現在、Windows環境を主な開発環境として整備しています。

Node.jsやpnpmのバージョンは`mise.toml`で管理しているため、個別にバージョンを合わせるのではなくmiseを利用してください。

```powershell
mise install
pnpm install
pnpm dev
```

詳しい開発環境の構築方法やコマンドについては、[Development Guide](docs/development.md)を参照してください。

---

## Documentation

- [Architecture](docs/architecture.md) — Kuonのシステム構成・アーキテクチャ
- [Development Guide](docs/development.md) — 開発環境の構築・開発手順
- [Environment Configuration](docs/environment-configuration.md) — Server Settings / SMTP / OIDC / OAuth2 / SAMLを環境変数から構成する方法
- [Contributing Guide](CONTRIBUTING.md) — ブランチ、Commit、Pull Requestなどの開発ルール

---

## Contributing

Kuonへのコントリビューションを歓迎します。

開発に参加する場合は、まず[Contributing Guide](CONTRIBUTING.md)を確認してください。

IssueやPull Requestを通して、バグ報告・機能提案・コード変更などを行えます。

---

## Project Status

Kuonは現在、初期開発段階です。

APIやデータベース構造、UIなどは今後変更される可能性があります。

正式リリースに向けて、機能追加・設計改善・ドキュメント整備を進めています。

---

## License

現在準備中です。

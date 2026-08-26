ALTER TABLE knowledge.roles
  ADD COLUMN IF NOT EXISTS is_builtin BOOLEAN NOT NULL DEFAULT FALSE;

-- Migrations run before the normal init seed. Ensure the preset roles exist here
-- so their Permission mappings are available on the very first startup.
INSERT INTO knowledge.roles (name, display_name, description, is_builtin) VALUES
  ('admin', 'Admin', '全権限。ユーザ管理、設定変更、コンテンツ編集・削除など', TRUE),
  ('moderator', 'Moderator', '投稿やコメント、タグの管理・削除', TRUE),
  ('general', 'General', '自分のコンテンツの作成・編集', TRUE),
  ('readonly', 'Readonly', '閲覧専用。編集・削除不可', TRUE)
ON CONFLICT (name) DO UPDATE SET is_builtin = TRUE;

CREATE TABLE IF NOT EXISTS knowledge.permissions (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  key VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge.role_permissions (
  role_id UUID NOT NULL REFERENCES knowledge.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES knowledge.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
  ON knowledge.role_permissions(permission_id);

UPDATE knowledge.roles
SET is_builtin = TRUE
WHERE name IN ('admin', 'moderator', 'general', 'readonly');

INSERT INTO knowledge.permissions (key, display_name, category, description) VALUES
  ('article.read', '記事を閲覧', 'article', '公開範囲内の記事を閲覧できます'),
  ('article.create', '記事を作成', 'article', '記事を新規作成できます'),
  ('article.update.own', '自分の記事を編集', 'article', '自分が作成した記事を編集できます'),
  ('article.update.any', 'すべての記事を編集', 'article', '所有者に関係なく記事を編集できます'),
  ('article.delete.own', '自分の記事を削除', 'article', '自分が作成した記事を削除できます'),
  ('article.delete.any', 'すべての記事を削除', 'article', '所有者に関係なく記事を削除できます'),
  ('comment.create', 'コメントを作成', 'comment', 'コメントを投稿できます'),
  ('comment.delete.own', '自分のコメントを削除', 'comment', '自分のコメントを削除できます'),
  ('comment.delete.any', 'すべてのコメントを削除', 'comment', '所有者に関係なくコメントを削除できます'),
  ('tag.manage', 'タグを管理', 'tag', 'タグ情報とタグ画像を編集できます'),
  ('user.read', 'ユーザー一覧を閲覧', 'user', '管理画面からユーザー情報を確認できます'),
  ('user.manage', 'ユーザーを管理', 'user', 'ユーザーの有効・無効などを管理できます'),
  ('role.read', 'ロールを閲覧', 'role', 'ロールとPermissionの設定を確認できます'),
  ('role.create', 'ロールを作成', 'role', 'カスタムロールを作成できます'),
  ('role.update', 'ロールを編集', 'role', 'ロールのPermission構成を編集できます'),
  ('role.delete', 'ロールを削除', 'role', 'カスタムロールを削除できます'),
  ('role.assign', 'ロールを割り当て', 'role', 'ユーザーへロールを割り当てられます'),
  ('system.settings.manage', 'システム設定を管理', 'system', 'Kuonのシステム設定を変更できます'),
  ('system.idp.manage', 'IdP設定を管理', 'system', '外部IdP設定を変更できます'),
  ('system.webhook.manage', 'Webhookを管理', 'system', 'Webhook設定を変更できます'),
  ('system.backup.execute', 'Backup / Restoreを実行', 'system', 'バックアップの作成とリストアを実行できます'),
  ('system.maintenance.bypass', 'メンテナンスモードを回避', 'system', 'メンテナンスモード中も管理操作のため画面へアクセスできます'),
  ('eventlog.read', 'イベントログを閲覧', 'system', 'サーバイベントログを閲覧できます')
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- Admin is a preset containing all permissions.
INSERT INTO knowledge.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM knowledge.roles r
CROSS JOIN knowledge.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Moderator can manage content and tags, but not users or system settings.
INSERT INTO knowledge.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM knowledge.roles r
JOIN knowledge.permissions p ON p.key IN (
  'article.read', 'article.create', 'article.update.own', 'article.update.any',
  'article.delete.own', 'article.delete.any', 'comment.create',
  'comment.delete.own', 'comment.delete.any', 'tag.manage'
)
WHERE r.name = 'moderator'
ON CONFLICT DO NOTHING;

-- General users can manage their own content.
INSERT INTO knowledge.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM knowledge.roles r
JOIN knowledge.permissions p ON p.key IN (
  'article.read', 'article.create', 'article.update.own', 'article.delete.own',
  'comment.create', 'comment.delete.own'
)
WHERE r.name = 'general'
ON CONFLICT DO NOTHING;

-- Readonly users only receive read permission.
INSERT INTO knowledge.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM knowledge.roles r
JOIN knowledge.permissions p ON p.key = 'article.read'
WHERE r.name = 'readonly'
ON CONFLICT DO NOTHING;

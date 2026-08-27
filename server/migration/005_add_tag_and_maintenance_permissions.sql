-- 004適用済み環境向けの追補Permission。
-- タグ管理とメンテナンスモード回避を既存Permission基盤へ追加する。
INSERT INTO knowledge.permissions (key, display_name, category, description) VALUES
  ('tag.manage', 'タグを管理', 'tag', 'タグ情報とタグ画像を編集できます'),
  ('system.maintenance.bypass', 'メンテナンスモードを回避', 'system', 'メンテナンスモード中も管理操作のため画面へアクセスできます')
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- Adminにはタグ管理とメンテナンスモード回避の両方を付与する
INSERT INTO knowledge.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM knowledge.roles r
JOIN knowledge.permissions p ON p.key IN ('tag.manage', 'system.maintenance.bypass')
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Moderatorには従来のタグ管理権限を維持する
INSERT INTO knowledge.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM knowledge.roles r
JOIN knowledge.permissions p ON p.key = 'tag.manage'
WHERE r.name = 'moderator'
ON CONFLICT DO NOTHING;

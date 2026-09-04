INSERT INTO knowledge.permissions (key, display_name, category, description) VALUES
  ('tag.create', 'タグを作成', 'tag', '新しいタグを作成できます')
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- General / Moderator / Admin はタグを新規作成できる。
INSERT INTO knowledge.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM knowledge.roles r
JOIN knowledge.permissions p ON p.key = 'tag.create'
WHERE r.name IN ('general', 'moderator', 'admin')
ON CONFLICT DO NOTHING;

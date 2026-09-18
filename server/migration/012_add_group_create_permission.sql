INSERT INTO knowledge.permissions (key, display_name, category, description) VALUES
  ('group.create', 'グループを作成', 'group', '新しいグループを作成できます')
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

INSERT INTO knowledge.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM knowledge.roles r
JOIN knowledge.permissions p ON p.key = 'group.create'
WHERE r.name IN ('general', 'moderator', 'admin')
ON CONFLICT DO NOTHING;

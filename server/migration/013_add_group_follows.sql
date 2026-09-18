CREATE TABLE IF NOT EXISTS knowledge.group_follows (
    user_id UUID NOT NULL REFERENCES knowledge.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES knowledge.groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_group_follows_group_id
    ON knowledge.group_follows(group_id);

ALTER TABLE knowledge.user_settings
    ADD COLUMN IF NOT EXISTS notify_on_followed_group_article BOOLEAN DEFAULT TRUE;

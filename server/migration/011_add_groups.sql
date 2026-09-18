CREATE TABLE IF NOT EXISTS knowledge.groups (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES knowledge.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge.user_groups (
    user_id UUID NOT NULL REFERENCES knowledge.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES knowledge.groups(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id),
    CONSTRAINT user_groups_role_check CHECK (role IN ('owner', 'admin', 'member'))
);

CREATE INDEX IF NOT EXISTS idx_user_groups_group_id
    ON knowledge.user_groups(group_id);

ALTER TABLE knowledge.articles
    ADD COLUMN IF NOT EXISTS group_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'articles_group_id_fkey'
          AND conrelid = 'knowledge.articles'::regclass
    ) THEN
        ALTER TABLE knowledge.articles
            ADD CONSTRAINT articles_group_id_fkey
            FOREIGN KEY (group_id)
            REFERENCES knowledge.groups(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_articles_group_id
    ON knowledge.articles(group_id);

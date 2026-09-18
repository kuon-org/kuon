ALTER TABLE knowledge.articles
    ADD COLUMN IF NOT EXISTS visibility VARCHAR(10);

UPDATE knowledge.articles
SET visibility = CASE
    WHEN is_private = TRUE THEN 'private'
    WHEN is_published = TRUE THEN 'public'
    ELSE 'unlisted'
END
WHERE visibility IS NULL;

ALTER TABLE knowledge.articles
    ALTER COLUMN visibility SET DEFAULT 'unlisted',
    ALTER COLUMN visibility SET NOT NULL;

ALTER TABLE knowledge.articles
    DROP CONSTRAINT IF EXISTS articles_visibility_check,
    ADD CONSTRAINT articles_visibility_check CHECK (visibility IN ('public', 'unlisted', 'private', 'members'));

ALTER TABLE knowledge.articles
    DROP CONSTRAINT IF EXISTS articles_members_group_check,
    ADD CONSTRAINT articles_members_group_check CHECK (visibility <> 'members' OR group_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_articles_visibility ON knowledge.articles(visibility);

CREATE TABLE IF NOT EXISTS knowledge.webhooks (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR(100) NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'system',
    owner_user_id UUID REFERENCES knowledge.users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL DEFAULT 'generic',
    url TEXT NOT NULL,
    http_method VARCHAR(10) NOT NULL DEFAULT 'POST',
    payload_template JSONB NOT NULL DEFAULT '{}'::jsonb,
    event_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT webhooks_scope_check CHECK (scope IN ('system', 'user')),
    CONSTRAINT webhooks_owner_scope_check CHECK (
        (scope = 'system' AND owner_user_id IS NULL)
        OR (scope = 'user' AND owner_user_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS knowledge.webhook_headers (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    webhook_id UUID NOT NULL REFERENCES knowledge.webhooks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT webhook_headers_name_unique UNIQUE (webhook_id, name)
);

CREATE TABLE IF NOT EXISTS knowledge.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    webhook_id UUID NOT NULL REFERENCES knowledge.webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    success BOOLEAN NOT NULL,
    status_code INTEGER,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhooks_scope
    ON knowledge.webhooks(scope);

CREATE INDEX IF NOT EXISTS idx_webhooks_owner_user_id
    ON knowledge.webhooks(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_webhooks_is_active
    ON knowledge.webhooks(is_active);

CREATE INDEX IF NOT EXISTS idx_webhooks_event_type
    ON knowledge.webhooks(event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id_created_at
    ON knowledge.webhook_deliveries(webhook_id, created_at DESC);

COMMENT ON TABLE knowledge.webhooks IS '汎用Webhook定義';
COMMENT ON COLUMN knowledge.webhooks.scope IS 'Webhookの適用範囲(system/user)';
COMMENT ON COLUMN knowledge.webhooks.owner_user_id IS 'user scopeの場合の所有ユーザ';
COMMENT ON COLUMN knowledge.webhooks.provider IS 'generic/discord/slack/teams等のPreset識別子';
COMMENT ON COLUMN knowledge.webhooks.payload_template IS '送信時に評価するJSON payload template';
COMMENT ON COLUMN knowledge.webhooks.event_type IS '購読する単一Webhook event';
COMMENT ON TABLE knowledge.webhook_headers IS 'Webhook送信時に追加するHTTP Header';
COMMENT ON COLUMN knowledge.webhook_headers.is_secret IS 'UI/ログで値を秘匿すべきHeaderか';
COMMENT ON TABLE knowledge.webhook_deliveries IS 'Webhook配信結果履歴';

-- サーバイベントログ
CREATE TABLE IF NOT EXISTS knowledge.server_events (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    category VARCHAR(30) NOT NULL DEFAULT 'system',
    event_type VARCHAR(100) NOT NULL,
    level VARCHAR(10) NOT NULL,
    source VARCHAR(100),
    message TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    actor_user_id UUID REFERENCES knowledge.users(id) ON DELETE SET NULL,
    ip_address INET,
    subject_type VARCHAR(50),
    subject_id UUID,
    before_data JSONB,
    after_data JSONB,
    correlation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT server_events_level_check CHECK (level IN ('info', 'warning', 'error')),
    CONSTRAINT server_events_category_check CHECK (category IN ('system', 'audit'))
);

CREATE INDEX IF NOT EXISTS idx_server_events_created_at
    ON knowledge.server_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_server_events_level
    ON knowledge.server_events(level);

CREATE INDEX IF NOT EXISTS idx_server_events_event_type
    ON knowledge.server_events(event_type);

CREATE INDEX IF NOT EXISTS idx_server_events_category
    ON knowledge.server_events(category);

CREATE INDEX IF NOT EXISTS idx_server_events_correlation_id
    ON knowledge.server_events(correlation_id)
    WHERE correlation_id IS NOT NULL;

COMMENT ON TABLE knowledge.server_events IS 'Kuonサーバ内部で発生した構造化イベントログ';
COMMENT ON COLUMN knowledge.server_events.id IS 'イベントID';
COMMENT ON COLUMN knowledge.server_events.category IS 'イベントカテゴリ(system/audit)。現状はsystemを利用し、将来の監査ログ拡張に備える';
COMMENT ON COLUMN knowledge.server_events.event_type IS 'イベント種別';
COMMENT ON COLUMN knowledge.server_events.level IS 'ログレベル(info/warning/error)';
COMMENT ON COLUMN knowledge.server_events.source IS 'イベント発生元コンポーネント';
COMMENT ON COLUMN knowledge.server_events.message IS 'イベント概要';
COMMENT ON COLUMN knowledge.server_events.metadata IS 'イベント固有の追加情報。機密情報は保存しない';
COMMENT ON COLUMN knowledge.server_events.actor_user_id IS '操作主体ユーザID。システム起因の場合はNULL';
COMMENT ON COLUMN knowledge.server_events.ip_address IS '操作元IPアドレス';
COMMENT ON COLUMN knowledge.server_events.subject_type IS '対象リソース種別。将来のAudit/Revertで利用可能';
COMMENT ON COLUMN knowledge.server_events.subject_id IS '対象リソースID。将来のAudit/Revertで利用可能';
COMMENT ON COLUMN knowledge.server_events.before_data IS '変更前スナップショット。将来のAudit/Revert向け予約領域';
COMMENT ON COLUMN knowledge.server_events.after_data IS '変更後スナップショット。将来のAudit/Revert向け予約領域';
COMMENT ON COLUMN knowledge.server_events.correlation_id IS '一連の処理を関連付ける相関ID';
COMMENT ON COLUMN knowledge.server_events.created_at IS 'イベント発生日時';

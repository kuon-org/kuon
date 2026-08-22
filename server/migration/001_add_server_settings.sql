CREATE TABLE IF NOT EXISTS knowledge.server_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE knowledge.server_settings IS 'Kuonインスタンス全体のサーバ設定を管理するテーブル';

COMMENT ON COLUMN knowledge.server_settings.key IS 'サーバ設定の識別子';
COMMENT ON COLUMN knowledge.server_settings.value IS 'サーバ設定の値';
COMMENT ON COLUMN knowledge.server_settings.updated_at IS 'サーバ設定が最後に更新された日時';
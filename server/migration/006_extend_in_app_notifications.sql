-- アプリ内通知の参照種別・通知理由を追加
ALTER TABLE knowledge.user_notifications
    ADD COLUMN IF NOT EXISTS reference_type VARCHAR(30),
    ADD COLUMN IF NOT EXISTS reasons JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN knowledge.user_notifications.reference_type IS '通知の参照先種別(article/comment等)';
COMMENT ON COLUMN knowledge.user_notifications.reasons IS '同一通知が生成された理由の一覧(JSON配列)';

-- ユーザ単位のアプリ内通知設定を細分化
ALTER TABLE knowledge.user_settings
    ADD COLUMN IF NOT EXISTS notify_on_article_comment BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notify_on_comment_reply BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notify_on_followed_tag_article BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS notify_on_followed_user_article BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN knowledge.user_settings.notify_on_article_comment IS '自分の記事へのコメントをアプリ内通知するか';
COMMENT ON COLUMN knowledge.user_settings.notify_on_comment_reply IS '自分のコメントへの返信をアプリ内通知するか';
COMMENT ON COLUMN knowledge.user_settings.notify_on_followed_tag_article IS 'フォロー中タグの新着記事をアプリ内通知するか';
COMMENT ON COLUMN knowledge.user_settings.notify_on_followed_user_article IS 'フォロー中ユーザの新着記事をアプリ内通知するか';

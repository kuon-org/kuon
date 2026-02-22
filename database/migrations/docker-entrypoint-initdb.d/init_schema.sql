-- スキーマ作成
CREATE SCHEMA IF NOT EXISTS knowledge;
SET search_path TO knowledge;

-- users テーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid7(),
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_by UUID
);


COMMENT ON TABLE users IS 'ユーザ情報';
COMMENT ON COLUMN users.id IS 'ユーザID';
COMMENT ON COLUMN users.username IS 'ログイン用ユーザ名';
COMMENT ON COLUMN users.display_name IS '表示名';
COMMENT ON COLUMN users.email IS 'メールアドレス';
COMMENT ON COLUMN users.avatar_url IS 'アバターURL';
COMMENT ON COLUMN users.bio IS 'プロフィール文';
COMMENT ON COLUMN users.created_at IS '作成日時';
COMMENT ON COLUMN users.updated_at IS '更新日時';
COMMENT ON COLUMN users.is_active IS '有効フラグ';
COMMENT ON COLUMN users.last_login_at IS '最終ログイン日時';
COMMENT ON COLUMN users.created_by IS '作成者ユーザID';

-- local_accounts
CREATE TABLE IF NOT EXISTS local_accounts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id),
    email VARCHAR(255),
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE local_accounts IS 'ローカルアカウント情報';
COMMENT ON COLUMN local_accounts.id IS 'ローカルアカウントID';
COMMENT ON COLUMN local_accounts.user_id IS '紐づくユーザID';
COMMENT ON COLUMN local_accounts.email IS 'メールアドレス';
COMMENT ON COLUMN local_accounts.password_hash IS 'パスワードハッシュ';
COMMENT ON COLUMN local_accounts.created_at IS '作成日時';
COMMENT ON COLUMN local_accounts.updated_at IS '更新日時';
COMMENT ON COLUMN local_accounts.is_verified IS 'メール確認済みフラグ';

-- identity_providers
CREATE TABLE IF NOT EXISTS identity_providers (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    provider_name VARCHAR(50) NOT NULL UNIQUE,      -- 内部識別名（例: google, github）
    display_name VARCHAR(50) NOT NULL,       -- UI表示名
    provider_type VARCHAR(20) NOT NULL,      -- 認証方式 (OIDC, SAML, LDAP, OAuth)
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE identity_providers IS '外部IdP情報';
COMMENT ON COLUMN identity_providers.id IS 'IdP ID';
COMMENT ON COLUMN identity_providers.provider_name IS 'プロバイダ名（内部識別用）';
COMMENT ON COLUMN identity_providers.display_name IS '表示名';
COMMENT ON COLUMN identity_providers.provider_type IS '認証方式(OIDC/SAML/LDAP/OAuth等)';
COMMENT ON COLUMN identity_providers.description IS '説明';
COMMENT ON COLUMN identity_providers.logo_url IS 'ロゴURL';
COMMENT ON COLUMN identity_providers.created_at IS '作成日時';
COMMENT ON COLUMN identity_providers.updated_at IS '更新日時';

-- idp_configurations
CREATE TABLE IF NOT EXISTS idp_configurations (
    provider_id UUID PRIMARY KEY REFERENCES identity_providers(id),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,   -- 方式固有設定をJSONBで保持
    button_color VARCHAR(20),                     -- ログインボタン背景色
    text_color VARCHAR(20),                       -- ログインボタン文字色
    is_active BOOLEAN DEFAULT FALSE,              -- 有効フラグ
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_tested_at TIMESTAMP,
    created_by UUID
);

COMMENT ON TABLE idp_configurations IS 'IdP接続設定';
COMMENT ON COLUMN idp_configurations.provider_id IS '外部IdP ID';
COMMENT ON COLUMN idp_configurations.config IS '方式固有設定 (JSON形式)';
COMMENT ON COLUMN idp_configurations.button_color IS 'ログインボタン背景色';
COMMENT ON COLUMN idp_configurations.text_color IS 'ログインボタン文字色';
COMMENT ON COLUMN idp_configurations.is_active IS '有効フラグ';
COMMENT ON COLUMN idp_configurations.created_at IS '作成日時';
COMMENT ON COLUMN idp_configurations.updated_at IS '更新日時';
COMMENT ON COLUMN idp_configurations.last_tested_at IS '最後の接続テスト日時';
COMMENT ON COLUMN idp_configurations.created_by IS '作成者ユーザID';

-- user_identities
CREATE TABLE IF NOT EXISTS user_identities (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) NOT NULL,
    provider_id UUID REFERENCES identity_providers(id) NOT NULL,
    provider_uid VARCHAR(255) NOT NULL,        -- IdP側ユーザID
    email VARCHAR(255),
    token_data JSONB DEFAULT '{}'::jsonb,      -- OAuthアクセストークン等をJSONBで保持
    linked_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

COMMENT ON TABLE user_identities IS 'ユーザとIdPの紐付け情報';
COMMENT ON COLUMN user_identities.id IS 'ID';
COMMENT ON COLUMN user_identities.user_id IS 'ユーザID';
COMMENT ON COLUMN user_identities.provider_id IS '外部IdP ID';
COMMENT ON COLUMN user_identities.provider_uid IS 'IdP側ユーザID';
COMMENT ON COLUMN user_identities.email IS 'メールアドレス';
COMMENT ON COLUMN user_identities.token_data IS '方式固有トークン情報(JSONB)';
COMMENT ON COLUMN user_identities.linked_at IS '紐付け日時';
COMMENT ON COLUMN user_identities.last_login_at IS '最終ログイン日時';

-- roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR(50) UNIQUE,
    display_name VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'ユーザ権限ロール';
COMMENT ON COLUMN roles.id IS 'ロールID';
COMMENT ON COLUMN roles.name IS '内部識別名';
COMMENT ON COLUMN roles.display_name IS '表示名';
COMMENT ON COLUMN roles.description IS '説明';
COMMENT ON COLUMN roles.created_at IS '作成日時';
COMMENT ON COLUMN roles.updated_at IS '更新日時';

-- user_roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID
);

COMMENT ON TABLE user_roles IS 'ユーザに付与されたロール情報';
COMMENT ON COLUMN user_roles.id IS 'ID';
COMMENT ON COLUMN user_roles.user_id IS 'ユーザID';
COMMENT ON COLUMN user_roles.role_id IS 'ロールID';
COMMENT ON COLUMN user_roles.assigned_at IS '付与日時';
COMMENT ON COLUMN user_roles.assigned_by IS '付与者ユーザID';

-- articles
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    raw_content TEXT,
    last_published_raw_content TEXT,
    render_content TEXT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(10),
    is_published BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    like_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    bookmark_count INT DEFAULT 0,
    comment_count INT DEFAULT 0
);

COMMENT ON TABLE articles IS '記事';
COMMENT ON COLUMN articles.id IS '記事ID';
COMMENT ON COLUMN articles.user_id IS '作成者ユーザID';
COMMENT ON COLUMN articles.title IS 'タイトル';
COMMENT ON COLUMN articles.raw_content IS '生コンテンツ';
COMMENT ON COLUMN articles.last_published_raw_content IS '最後に公開した時点の生コンテンツ';
COMMENT ON COLUMN articles.render_content IS 'レンダリング済みコンテンツ';
COMMENT ON COLUMN articles.summary IS '要約';
COMMENT ON COLUMN articles.created_at IS '作成日時';
COMMENT ON COLUMN articles.updated_at IS '更新日時';
COMMENT ON COLUMN articles.status IS 'ステータス';
COMMENT ON COLUMN articles.is_published IS '公開フラグ';
COMMENT ON COLUMN articles.is_private IS '非公開フラグ';
COMMENT ON COLUMN articles.is_deleted IS '論理削除フラグ';
COMMENT ON COLUMN articles.like_count IS 'いいね数';
COMMENT ON COLUMN articles.view_count IS '閲覧数';
COMMENT ON COLUMN articles.bookmark_count IS 'ブックマーク数';
COMMENT ON COLUMN articles.comment_count IS 'コメント数';

-- tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR(50),
    slug VARCHAR(50) UNIQUE,
    avatar_url TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE tags IS 'タグ';
COMMENT ON COLUMN tags.id IS 'タグID';
COMMENT ON COLUMN tags.name IS 'タグ名';
COMMENT ON COLUMN tags.slug IS 'スラッグ';
COMMENT ON COLUMN tags.avatar_url IS 'タグアイコン';
COMMENT ON COLUMN tags.description IS '説明';
COMMENT ON COLUMN tags.created_at IS '作成日時';

-- article_tags
CREATE TABLE IF NOT EXISTS article_tags (
    article_id UUID REFERENCES articles(id),
    tag_id UUID REFERENCES tags(id),
    attached_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (article_id, tag_id)
);

COMMENT ON TABLE article_tags IS '記事とタグの紐付け';
COMMENT ON COLUMN article_tags.article_id IS '記事ID';
COMMENT ON COLUMN article_tags.tag_id IS 'タグID';
COMMENT ON COLUMN article_tags.attached_at IS '紐付け日時';

-- article_likes
CREATE TABLE IF NOT EXISTS article_likes (
    article_id UUID REFERENCES articles(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (article_id, user_id)
);

COMMENT ON TABLE article_likes IS '記事へのいいね';
COMMENT ON COLUMN article_likes.article_id IS '記事ID';
COMMENT ON COLUMN article_likes.user_id IS 'ユーザID';
COMMENT ON COLUMN article_likes.created_at IS '作成日時';

-- article_views
CREATE TABLE IF NOT EXISTS article_views (
    article_id UUID REFERENCES articles(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (article_id, user_id)
);

COMMENT ON TABLE article_views IS '記事閲覧履歴';
COMMENT ON COLUMN article_views.article_id IS '記事ID';
COMMENT ON COLUMN article_views.user_id IS 'ユーザID';
COMMENT ON COLUMN article_views.created_at IS '作成日時';

-- article_bookmarks
CREATE TABLE IF NOT EXISTS article_bookmarks (
    article_id UUID REFERENCES articles(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (article_id, user_id)
);

COMMENT ON TABLE article_bookmarks IS '記事ブックマーク';
COMMENT ON COLUMN article_bookmarks.article_id IS '記事ID';
COMMENT ON COLUMN article_bookmarks.user_id IS 'ユーザID';
COMMENT ON COLUMN article_bookmarks.created_at IS '作成日時';

-- comments
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    article_id UUID REFERENCES articles(id),
    user_id UUID REFERENCES users(id),
    body TEXT,
    parent_comment_id UUID REFERENCES comments(id),
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE comments IS 'コメント';
COMMENT ON COLUMN comments.id IS 'コメントID';
COMMENT ON COLUMN comments.article_id IS '記事ID';
COMMENT ON COLUMN comments.user_id IS 'ユーザID';
COMMENT ON COLUMN comments.body IS 'コメント本文';
COMMENT ON COLUMN comments.parent_comment_id IS '親コメントID';
COMMENT ON COLUMN comments.like_count IS 'いいね数';
COMMENT ON COLUMN comments.created_at IS '作成日時';
COMMENT ON COLUMN comments.updated_at IS '更新日時';
COMMENT ON COLUMN comments.is_deleted IS '削除フラグ';

-- comment_likes
CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id UUID REFERENCES comments(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

COMMENT ON TABLE comment_likes IS 'コメントいいね';
COMMENT ON COLUMN comment_likes.comment_id IS 'コメントID';
COMMENT ON COLUMN comment_likes.user_id IS 'ユーザID';
COMMENT ON COLUMN comment_likes.created_at IS '作成日時';

-- user_follows
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id UUID REFERENCES users(id),
    followee_id UUID REFERENCES users(id),
    followed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, followee_id)
);

COMMENT ON TABLE user_follows IS 'ユーザ間のフォロー関係';
COMMENT ON COLUMN user_follows.follower_id IS 'フォローする側のユーザID';
COMMENT ON COLUMN user_follows.followee_id IS 'フォローされる側のユーザID';
COMMENT ON COLUMN user_follows.followed_at IS 'フォロー日時';

-- upload_images テーブル (汎用版)
CREATE TABLE IF NOT EXISTS upload_images (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id) NOT NULL,
    category VARCHAR(20) NOT NULL,            -- 'article', 'avatar', 'system' 等
    original_name TEXT NOT NULL,
    mime_type VARCHAR(100),
    size_bytes INT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE upload_images IS 'アップロード画像管理';
COMMENT ON COLUMN upload_images.id IS '画像ID（実ファイル名に使用）';
COMMENT ON COLUMN upload_images.user_id IS 'ユーザID';
COMMENT ON COLUMN upload_images.category IS '用途（article/avatar等）';
COMMENT ON COLUMN upload_images.original_name IS 'オリジナルファイル名';
COMMENT ON COLUMN upload_images.mime_type IS 'MIMEタイプ（例: image/png, image/jpeg）';
COMMENT ON COLUMN upload_images.size_bytes IS 'ファイルサイズ（バイト単位）';
COMMENT ON COLUMN upload_images.created_at IS 'アップロード日時';



-- user_notifications
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),                         -- 通知種別 (like, comment, follow, system, etc.)
    title TEXT,
    message TEXT,
    reference_id UUID,                        -- 関連する記事やコメントのIDなど
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_notifications IS 'ユーザ通知情報';
COMMENT ON COLUMN user_notifications.user_id IS '通知対象ユーザID';
COMMENT ON COLUMN user_notifications.type IS '通知種別';
COMMENT ON COLUMN user_notifications.title IS '通知タイトル';
COMMENT ON COLUMN user_notifications.message IS '通知メッセージ';
COMMENT ON COLUMN user_notifications.reference_id IS '関連リソースID';
COMMENT ON COLUMN user_notifications.is_read IS '既読フラグ';
COMMENT ON COLUMN user_notifications.created_at IS '通知作成日時';

-- user_settings
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    language VARCHAR(10) DEFAULT 'ja',        -- 表示言語
    theme VARCHAR(20) DEFAULT 'light',        -- テーマ(light/dark)
    notify_on_like BOOLEAN DEFAULT TRUE,
    notify_on_comment BOOLEAN DEFAULT TRUE,
    notify_on_follow BOOLEAN DEFAULT TRUE,
    notify_via_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_settings IS 'ユーザ個別設定';
COMMENT ON COLUMN user_settings.user_id IS 'ユーザID';
COMMENT ON COLUMN user_settings.language IS '表示言語コード';
COMMENT ON COLUMN user_settings.theme IS 'テーマ設定';
COMMENT ON COLUMN user_settings.notify_on_like IS 'いいね通知';
COMMENT ON COLUMN user_settings.notify_on_comment IS 'コメント通知';
COMMENT ON COLUMN user_settings.notify_on_follow IS 'フォロー通知';
COMMENT ON COLUMN user_settings.notify_via_email IS 'メール通知を有効にするか';
COMMENT ON COLUMN user_settings.created_at IS '作成日時';
COMMENT ON COLUMN user_settings.updated_at IS '更新日時';

-- user_security
CREATE TABLE IF NOT EXISTS user_security (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  totp_secret TEXT,
  is_2fa_enabled BOOLEAN DEFAULT false
);

COMMENT ON TABLE user_security IS 'ユーザのセキュリティ設定';
COMMENT ON COLUMN user_security.user_id IS 'ユーザID';
COMMENT ON COLUMN user_security.totp_secret IS 'TOTPシークレット';
COMMENT ON COLUMN user_security.is_2fa_enabled IS '2FA有効化フラグ';

-- user_avatars
CREATE TABLE IF NOT EXISTS knowledge.user_avatars (
    id uuid NOT NULL DEFAULT uuidv7(),
    user_id uuid NOT NULL,
    service_name character varying(50) NOT NULL,
    avatar_url text NOT NULL,
    source_url text,
    is_selected boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT user_avatars_pkey PRIMARY KEY (id),
    CONSTRAINT user_avatars_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES knowledge.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
);

-- 1ユーザーにつき is_selected = true は1つだけという制約
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_user_avatars_selected_one 
-- ON knowledge.user_avatars (user_id) 
-- WHERE (is_selected = TRUE);

COMMENT ON TABLE knowledge.user_avatars IS 'ユーザーのアバター画像管理';
COMMENT ON COLUMN knowledge.user_avatars.id IS 'アバターID';
COMMENT ON COLUMN knowledge.user_avatars.user_id IS 'ユーザーID';
COMMENT ON COLUMN knowledge.user_avatars.service_name IS '取得元サービス名 (discord, twitter, local等)';
COMMENT ON COLUMN knowledge.user_avatars.avatar_url IS 'サーバー内のローカル保存パス';
COMMENT ON COLUMN knowledge.user_avatars.source_url IS '外部サービスのオリジナルURL';
COMMENT ON COLUMN knowledge.user_avatars.is_selected IS '現在選択中フラグ';

-- webhook_settings
CREATE TABLE IF NOT EXISTS knowledge.webhook_settings (
    id uuid NOT NULL DEFAULT uuidv7(),
    name VARCHAR(50) NOT NULL,                         -- 管理名（例: Discord通知）
    provider VARCHAR(30) NOT NULL,                     -- Webhook種別 (discord, slack, teams, custom)
    url TEXT NOT NULL,                                 -- Webhook URL
    headers JSONB DEFAULT '{}'::jsonb,                 -- 任意の追加HTTPヘッダー
    payload_template JSONB DEFAULT '{}'::jsonb,        -- カスタムWebhook用テンプレート
    is_active BOOLEAN DEFAULT false,                   -- 有効フラグ
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT webhook_settings_pkey PRIMARY KEY (id),
    CONSTRAINT webhook_settings_name_unique UNIQUE (name)
);

COMMENT ON TABLE knowledge.webhook_settings IS 'Webhook通知設定';
COMMENT ON COLUMN knowledge.webhook_settings.id IS 'Webhook設定ID';
COMMENT ON COLUMN knowledge.webhook_settings.name IS '管理名';
COMMENT ON COLUMN knowledge.webhook_settings.provider IS 'Webhook種別 (discord, slack, teams, custom)';
COMMENT ON COLUMN knowledge.webhook_settings.url IS 'Webhook送信先URL';
COMMENT ON COLUMN knowledge.webhook_settings.headers IS '追加HTTPヘッダー（カスタムWebhook用）';
COMMENT ON COLUMN knowledge.webhook_settings.payload_template IS '送信ペイロードテンプレート';
COMMENT ON COLUMN knowledge.webhook_settings.is_active IS '有効化フラグ';
COMMENT ON COLUMN knowledge.webhook_settings.created_at IS '作成日時';
COMMENT ON COLUMN knowledge.webhook_settings.updated_at IS '更新日時';

-- tag_follows
CREATE TABLE IF NOT EXISTS knowledge.tag_follows (
    user_id UUID REFERENCES users(id),
    tag_id UUID REFERENCES tags(id),
    followed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, tag_id)
);

COMMENT ON TABLE knowledge.tag_follows IS 'ユーザのフォローしているタグ';
COMMENT ON COLUMN knowledge.tag_follows.user_id IS 'フォローしたユーザ';
COMMENT ON COLUMN knowledge.tag_follows.tag_id IS 'フォローされたタグ';
COMMENT ON COLUMN knowledge.tag_follows.followed_at IS 'フォロー日時';




-- ---------------------------------
-- 記事の like, view, bookmark, comment 更新関数
-- ---------------------------------
CREATE OR REPLACE FUNCTION knowledge.update_article_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'article_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE knowledge.articles SET like_count = like_count + 1 WHERE id = NEW.article_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE knowledge.articles SET like_count = like_count - 1 WHERE id = OLD.article_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'article_views' AND TG_OP = 'INSERT' THEN
        UPDATE knowledge.articles SET view_count = view_count + 1 WHERE id = NEW.article_id;
    ELSIF TG_TABLE_NAME = 'article_bookmarks' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE knowledge.articles SET bookmark_count = bookmark_count + 1 WHERE id = NEW.article_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE knowledge.articles SET bookmark_count = bookmark_count - 1 WHERE id = OLD.article_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE knowledge.articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE knowledge.articles SET comment_count = comment_count - 1 WHERE id = OLD.article_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- コメントの like 更新関数
CREATE OR REPLACE FUNCTION knowledge.update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE knowledge.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE knowledge.comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------
-- トリガー作成
-- ---------------------------------
-- 記事 likes
CREATE TRIGGER article_likes_insert
AFTER INSERT ON knowledge.article_likes
FOR EACH ROW
EXECUTE FUNCTION knowledge.update_article_counts();

CREATE TRIGGER article_likes_delete
AFTER DELETE ON knowledge.article_likes
FOR EACH ROW
EXECUTE FUNCTION knowledge.update_article_counts();

-- 記事 views
CREATE TRIGGER article_views_insert
AFTER INSERT ON knowledge.article_views
FOR EACH ROW
EXECUTE FUNCTION knowledge.update_article_counts();

-- 記事 bookmarks
CREATE TRIGGER article_bookmarks_insert
AFTER INSERT ON knowledge.article_bookmarks
FOR EACH ROW
EXECUTE FUNCTION knowledge.update_article_counts();

CREATE TRIGGER article_bookmarks_delete
AFTER DELETE ON knowledge.article_bookmarks
FOR EACH ROW
EXECUTE FUNCTION knowledge.update_article_counts();

-- コメント追加/削除
CREATE TRIGGER comments_insert
AFTER INSERT ON knowledge.comments
FOR EACH ROW
EXECUTE FUNCTION knowledge.update_article_counts();

CREATE TRIGGER comments_delete
AFTER DELETE ON knowledge.comments
FOR EACH ROW
EXECUTE FUNCTION knowledge.update_article_counts();

-- コメント likes
CREATE TRIGGER comment_likes_insert
AFTER INSERT ON knowledge.comment_likes
FOR EACH ROW
EXECUTE FUNCTION knowledge.update_comment_like_count();

CREATE TRIGGER comment_likes_delete
AFTER DELETE ON knowledge.comment_likes
FOR EACH ROW
EXECUTE FUNCTION knowledge.update_comment_like_count();

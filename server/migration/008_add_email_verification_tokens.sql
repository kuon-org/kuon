CREATE TABLE IF NOT EXISTS knowledge.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL REFERENCES knowledge.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id
  ON knowledge.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at
  ON knowledge.email_verification_tokens(expires_at);

COMMENT ON TABLE knowledge.email_verification_tokens IS 'ローカルアカウントのメール確認Token';
COMMENT ON COLUMN knowledge.email_verification_tokens.token_hash IS 'Verification TokenのSHA-256ハッシュ';

-- Onscript account linking, shipped-post tracking, cross-device workspace.
CREATE TABLE IF NOT EXISTS onscript_sessions (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  email text NOT NULL,
  access_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  onscript_post_id text NOT NULL,
  text text NOT NULL,
  platforms text[] NOT NULL,
  status text NOT NULL,
  permalink text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_user_created_idx ON posts (user_id, created_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace jsonb;

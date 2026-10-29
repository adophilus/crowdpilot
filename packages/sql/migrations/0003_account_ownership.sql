-- Account ownership: CrowdPilot maps its own users to the connected accounts
-- that live under the single shared Onscript account. Also retires the
-- per-user Onscript session linking (wrong model — one service account, not
-- one per CrowdPilot user).
ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS display_name text;

DROP TABLE IF EXISTS onscript_sessions;

-- The demo persona ships through the admin's own X account (the only X
-- connected on Onscript staging).
INSERT INTO connected_accounts (user_id, platform, onscript_account_id, username)
SELECT id, 'TWITTER', '01M49BNXH70TG7Q55EVR8S3TAM', 'adophilus'
FROM users
WHERE email = 'demo@crowdpilot.local'
ON CONFLICT (platform, onscript_account_id) DO NOTHING;

-- Multiple CrowdPilot users can map the same shared Onscript X account
-- (the shared-demo model: every user posts through the integration's X).
-- Ownership stays per-user in this table.
ALTER TABLE connected_accounts
  DROP CONSTRAINT IF EXISTS connected_accounts_platform_onscript_account_id_key;

-- Refresh any stale mappings to the live grant (reconnect replaced the row id).
UPDATE connected_accounts
  SET onscript_account_id = '01KWC5RZ0YBDWCZWNRTSK18XHH'
  WHERE platform = 'TWITTER';

-- New walkthrough/production user gets their own mapping.
INSERT INTO connected_accounts (user_id, platform, onscript_account_id, username)
SELECT id, 'TWITTER', '01KWC5RZ0YBDWCZWNRTSK18XHH', 'adophilus'
  FROM users WHERE email = 'uchenna19of+qah1@gmail.com'
ON CONFLICT DO NOTHING;

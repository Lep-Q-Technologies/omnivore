-- Rollback Migration: Revert subscription unification
-- Date: 2025-11-30
-- Description: Rollback for ARC-016 - Reverts subscription table back to rss_feed

-- ============================================================================
-- DOWN Migration (Rollback)
-- ============================================================================

-- Step 1: Drop new constraints
ALTER TABLE omnivore.subscription
DROP CONSTRAINT IF EXISTS chk_subscription_email_alias;

ALTER TABLE omnivore.subscription
DROP CONSTRAINT IF EXISTS chk_subscription_source_type;

-- Step 2: Drop new indexes
DROP INDEX IF EXISTS omnivore.idx_subscription_email_alias;
DROP INDEX IF EXISTS omnivore.idx_subscription_source_type;
DROP INDEX IF EXISTS omnivore.idx_subscription_last_fetched;
DROP INDEX IF EXISTS omnivore.idx_subscription_active;
DROP INDEX IF EXISTS omnivore.idx_subscription_user_id;

-- Step 3: Recreate old indexes
CREATE INDEX idx_rss_feed_user_id ON omnivore.subscription (user_id);
CREATE INDEX idx_rss_feed_active ON omnivore.subscription (active);
CREATE INDEX idx_rss_feed_last_fetched
  ON omnivore.subscription (last_fetched_at)
  WHERE active = true;

-- Step 4: Rename constraint back
ALTER TABLE omnivore.subscription
RENAME CONSTRAINT uq_subscription_user_source TO uq_rss_feed_user_url;

-- Step 5: Remove new columns
ALTER TABLE omnivore.subscription DROP COLUMN IF EXISTS unsubscribe_http_url;
ALTER TABLE omnivore.subscription DROP COLUMN IF EXISTS unsubscribe_mail_to;
ALTER TABLE omnivore.subscription DROP COLUMN IF EXISTS auto_add_labels;
ALTER TABLE omnivore.subscription DROP COLUMN IF EXISTS folder;
ALTER TABLE omnivore.subscription DROP COLUMN IF EXISTS email_alias;

-- Step 6: Rename source_identifier back to feed_url
ALTER TABLE omnivore.subscription
RENAME COLUMN source_identifier TO feed_url;

-- Step 7: Remove source_type column
ALTER TABLE omnivore.subscription DROP COLUMN IF EXISTS source_type;

-- Step 8: Rename table back to rss_feed
ALTER TABLE omnivore.subscription RENAME TO rss_feed;

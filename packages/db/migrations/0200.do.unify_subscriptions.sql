-- Migration: Unify RSS and Newsletter subscriptions
-- Date: 2025-11-30
-- Description: Part of ARC-016 (Newsletter Subscriptions)
--              Renames rss_feed → subscription and extends it to support newsletters
--              Adds source_type, email_alias, folder, and auto_add_labels columns

-- ============================================================================
-- UP Migration
-- ============================================================================

-- Step 1: Rename table
ALTER TABLE omnivore.rss_feed RENAME TO subscription;

-- Step 2: Add source_type column (defaults to 'RSS' for existing rows)
ALTER TABLE omnivore.subscription
ADD COLUMN source_type VARCHAR(20) DEFAULT 'RSS' NOT NULL;

-- Step 3: Rename feed_url → source_identifier (more generic name)
ALTER TABLE omnivore.subscription
RENAME COLUMN feed_url TO source_identifier;

-- Step 4: Add email_alias for newsletter routing
-- This is the unique email suffix for this subscription
-- For newsletters: full email is {user.email_alias}+{subscription.email_alias}@inbox.omnivore.app
-- For RSS: this field is NULL
ALTER TABLE omnivore.subscription
ADD COLUMN email_alias VARCHAR(64) UNIQUE;

-- Step 5: Add folder for auto-routing content
-- Example: 'tech-news', 'personal-dev', etc.
-- NULL means use default folder logic (inbox or following)
ALTER TABLE omnivore.subscription
ADD COLUMN folder VARCHAR(255);

-- Step 6: Add auto_add_labels for automatic tagging
-- Stores array of label names to auto-apply to items from this subscription
-- Using text array for simplicity (PostgreSQL native type)
ALTER TABLE omnivore.subscription
ADD COLUMN auto_add_labels TEXT[];

-- Step 7: Add unsubscribe fields (for newsletters)
-- These are extracted from newsletter emails and used for one-click unsubscribe
-- NULL for RSS subscriptions
ALTER TABLE omnivore.subscription
ADD COLUMN unsubscribe_mail_to TEXT;

ALTER TABLE omnivore.subscription
ADD COLUMN unsubscribe_http_url TEXT;

-- Step 8: Rename constraint to match new table name
ALTER TABLE omnivore.subscription
RENAME CONSTRAINT uq_rss_feed_user_url TO uq_subscription_user_source;

-- Step 8: Update indexes with new table name
DROP INDEX IF EXISTS omnivore.idx_rss_feed_user_id;
DROP INDEX IF EXISTS omnivore.idx_rss_feed_active;
DROP INDEX IF EXISTS omnivore.idx_rss_feed_last_fetched;

CREATE INDEX idx_subscription_user_id ON omnivore.subscription (user_id);
CREATE INDEX idx_subscription_active ON omnivore.subscription (active);
CREATE INDEX idx_subscription_source_type ON omnivore.subscription (source_type);
CREATE INDEX idx_subscription_last_fetched
  ON omnivore.subscription (last_fetched_at)
  WHERE active = true AND source_type = 'RSS';

-- Step 9: Add index for newsletter routing by email alias
CREATE INDEX idx_subscription_email_alias
  ON omnivore.subscription (email_alias)
  WHERE email_alias IS NOT NULL;

-- Step 10: Add check constraint for source_type
ALTER TABLE omnivore.subscription
ADD CONSTRAINT chk_subscription_source_type
CHECK (source_type IN ('RSS', 'NEWSLETTER'));

-- Step 11: Add constraint to ensure email_alias exists for newsletters
-- For newsletters, email_alias must be set; for RSS, it must be NULL
ALTER TABLE omnivore.subscription
ADD CONSTRAINT chk_subscription_email_alias
CHECK (
  (source_type = 'NEWSLETTER' AND email_alias IS NOT NULL) OR
  (source_type = 'RSS' AND email_alias IS NULL)
);

-- Step 12: Update table and column comments
COMMENT ON TABLE omnivore.subscription IS 'Unified subscription table for RSS feeds, newsletters, and future content sources. Part of ARC-016.';

COMMENT ON COLUMN omnivore.subscription.source_type IS 'Type of subscription: RSS, NEWSLETTER, etc.';

COMMENT ON COLUMN omnivore.subscription.source_identifier IS 'Feed URL for RSS, sender email for newsletters, etc.';

COMMENT ON COLUMN omnivore.subscription.email_alias IS 'Unique email suffix for newsletter subscriptions (e.g., "b3n5p8q2" in user+b3n5p8q2@inbox.omnivore.app)';

COMMENT ON COLUMN omnivore.subscription.folder IS 'Optional folder to auto-route content from this subscription';

COMMENT ON COLUMN omnivore.subscription.auto_add_labels IS 'Array of label names to automatically apply to items from this subscription';

COMMENT ON COLUMN omnivore.subscription.unsubscribe_mail_to IS 'Email address for unsubscribing (newsletters only, extracted from List-Unsubscribe header)';

COMMENT ON COLUMN omnivore.subscription.unsubscribe_http_url IS 'HTTP URL for unsubscribing (newsletters only, extracted from List-Unsubscribe header)';

COMMENT ON COLUMN omnivore.subscription.last_fetched_at IS 'Last time we fetched/received items (RSS polling or newsletter email)';

COMMENT ON COLUMN omnivore.subscription.item_count IS 'Total number of items imported from this subscription';

COMMENT ON COLUMN omnivore.subscription.failure_count IS 'Consecutive fetch failures (RSS only) for exponential backoff';

-- Type: DO
-- Name: add_subscription_id_to_library_item
-- Description: Add subscription_id column to link library items to their RSS feed subscription

BEGIN;

-- Add subscription_id column to library_item
ALTER TABLE omnivore.library_item
  ADD COLUMN subscription_id UUID REFERENCES omnivore.rss_feed(id) ON DELETE SET NULL;

-- Add index for filtering by subscription
CREATE INDEX idx_library_item_subscription
  ON omnivore.library_item(subscription_id)
  WHERE subscription_id IS NOT NULL;

-- Add composite index for common queries (user + subscription)
CREATE INDEX idx_library_item_user_subscription
  ON omnivore.library_item(user_id, subscription_id)
  WHERE subscription_id IS NOT NULL;

-- Add index for unread counts per subscription
CREATE INDEX idx_library_item_subscription_unread
  ON omnivore.library_item(subscription_id, state, read_at)
  WHERE subscription_id IS NOT NULL AND read_at IS NULL;

COMMIT;

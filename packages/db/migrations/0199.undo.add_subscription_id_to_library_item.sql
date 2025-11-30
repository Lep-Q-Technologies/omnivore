-- Type: UNDO
-- Name: add_subscription_id_to_library_item
-- Description: Remove subscription_id column from library_item

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS omnivore.idx_library_item_subscription_unread;
DROP INDEX IF EXISTS omnivore.idx_library_item_user_subscription;
DROP INDEX IF EXISTS omnivore.idx_library_item_subscription;

-- Remove subscription_id column
ALTER TABLE omnivore.library_item
  DROP COLUMN IF EXISTS subscription_id;

COMMIT;

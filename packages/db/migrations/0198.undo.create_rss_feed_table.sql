-- Rollback Migration: Drop rss_feed table
-- Date: 2024-11-24
-- Description: Rollback for ARC-014 Phase 3 - RSS Feed Parsing

-- ============================================================================
-- DOWN Migration (Rollback)
-- ============================================================================

-- Drop indexes
DROP INDEX IF EXISTS omnivore.idx_rss_feed_last_fetched;
DROP INDEX IF EXISTS omnivore.idx_rss_feed_active;
DROP INDEX IF EXISTS omnivore.idx_rss_feed_user_id;

-- Drop table
DROP TABLE IF EXISTS omnivore.rss_feed;

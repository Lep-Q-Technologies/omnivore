-- Migration: Create rss_feed table for RSS/Atom feed subscriptions
-- Date: 2024-11-24
-- Description: Part of ARC-014 (Additional Content Types) - Phase 3: RSS Feed Parsing
--              Creates a table to store user RSS feed subscriptions for auto-importing articles

-- ============================================================================
-- UP Migration
-- ============================================================================

-- Create rss_feed table
CREATE TABLE IF NOT EXISTS omnivore.rss_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES omnivore.user(id) ON DELETE CASCADE,
  feed_url VARCHAR(2048) NOT NULL,
  title VARCHAR(512),
  description TEXT,
  site_url VARCHAR(2048),
  site_icon VARCHAR(2048),
  last_fetched_at TIMESTAMPTZ,
  item_count INTEGER DEFAULT 0 NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  last_error TEXT,
  failure_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

-- Ensure one subscription per feed per user
CONSTRAINT uq_rss_feed_user_url UNIQUE(user_id, feed_url) );

-- Create indexes for efficient queries
CREATE INDEX idx_rss_feed_user_id ON omnivore.rss_feed (user_id);

CREATE INDEX idx_rss_feed_active ON omnivore.rss_feed (active);

CREATE INDEX idx_rss_feed_last_fetched ON omnivore.rss_feed (last_fetched_at)
WHERE
    active = true;

-- Add comment for documentation
COMMENT ON TABLE omnivore.rss_feed IS 'Stores user RSS/Atom feed subscriptions for auto-importing articles. Part of ARC-014 content type expansion.';

COMMENT ON COLUMN omnivore.rss_feed.feed_url IS 'The RSS/Atom feed URL to fetch';

COMMENT ON COLUMN omnivore.rss_feed.last_fetched_at IS 'Last successful fetch timestamp for refresh scheduling';

COMMENT ON COLUMN omnivore.rss_feed.item_count IS 'Total number of items imported from this feed';

COMMENT ON COLUMN omnivore.rss_feed.failure_count IS 'Consecutive fetch failures for exponential backoff';
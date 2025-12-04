-- Migration: Add email_alias to user table
-- Date: 2025-11-30
-- Description: Part of ARC-016 (Newsletter Subscriptions)
--              Adds email_alias column for newsletter email routing
--              Each user gets a unique alias like "a7x9k2m1" which becomes
--              a7x9k2m1@inbox.omnivore.app for newsletters

-- ============================================================================
-- UP Migration
-- ============================================================================

-- Step 1: Add email_alias column (nullable initially for data migration)
ALTER TABLE omnivore.user
ADD COLUMN email_alias VARCHAR(64);

-- Step 2: Generate unique email aliases for existing users
-- Uses MD5 hash of user ID + random number to create 8-character alphanumeric strings
-- This ensures uniqueness while being shorter and more memorable than full UUIDs
UPDATE omnivore.user
SET email_alias = LOWER(
  SUBSTRING(
    MD5(id::text || RANDOM()::text)
    FROM 1 FOR 8
  )
)
WHERE email_alias IS NULL;

-- Step 3: Make email_alias required and unique
ALTER TABLE omnivore.user
ALTER COLUMN email_alias SET NOT NULL;

ALTER TABLE omnivore.user
ADD CONSTRAINT uq_user_email_alias UNIQUE (email_alias);

-- Step 4: Add index for fast newsletter routing lookups
-- When email arrives at "a7x9k2m1+xyz@inbox.omnivore.app",
-- we extract "a7x9k2m1" and look up user by email_alias
CREATE INDEX idx_user_email_alias ON omnivore.user (email_alias);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN omnivore.user.email_alias IS 'Unique email alias for newsletter routing (e.g., "a7x9k2m1" becomes a7x9k2m1@inbox.omnivore.app or a7x9k2m1+suffix@inbox.omnivore.app). Part of ARC-016.';

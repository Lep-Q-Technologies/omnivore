-- Rollback Migration: Remove email_alias from user table
-- Date: 2025-11-30
-- Description: Rollback for ARC-016 - Removes email_alias column

-- ============================================================================
-- DOWN Migration (Rollback)
-- ============================================================================

-- Step 1: Drop index
DROP INDEX IF EXISTS omnivore.idx_user_email_alias;

-- Step 2: Drop unique constraint
ALTER TABLE omnivore.user
DROP CONSTRAINT IF EXISTS uq_user_email_alias;

-- Step 3: Drop email_alias column
ALTER TABLE omnivore.user
DROP COLUMN IF EXISTS email_alias;

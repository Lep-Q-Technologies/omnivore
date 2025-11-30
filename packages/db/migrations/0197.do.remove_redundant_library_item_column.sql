-- Migration: Remove redundant folder and content_reader columns from library_item table
-- Date: 2024-11-23
-- Description: As part of ARC-014 (Additional Content Types), we're consolidating redundant
--              fields in the library_item table:
--              1. Remove 'folder' column (now computed from 'state' field)
--              2. Remove 'content_reader' column (now computed from 'item_type' field)
--              3. The 'item_type' column is retained and semantically represents 'contentType'

-- ============================================================================
-- UP Migration
-- ============================================================================

-- Step 1: Drop the 'folder' column
-- This column was redundant as folder can be derived from the 'state' column:
--   - state = 'ARCHIVED' → folder = 'archive'
--   - state = 'DELETED' → folder = 'trash'
--   - state = 'SUCCEEDED' → folder = 'inbox'
ALTER TABLE omnivore.library_item DROP COLUMN IF EXISTS folder;

-- Step 2: Drop the 'content_reader' column
-- This column was redundant as content reader can be derived from 'item_type':
--   - item_type = 'pdf' → content_reader = 'PDF'
--   - item_type = 'video' → content_reader = 'WEB'
--   - item_type = 'article' → content_reader = 'WEB'
--   - etc.
ALTER TABLE omnivore.library_item
DROP COLUMN IF EXISTS content_reader;

-- ============================================================================
-- DOWN Migration (Rollback)
-- ============================================================================

-- WARNING: Rolling back this migration will LOSE DATA as we cannot accurately
-- reconstruct the original values. The columns will be recreated with default
-- values based on the remaining fields.

-- Uncomment the following to enable rollback (not recommended for production):

-- -- Recreate folder column with default values
-- ALTER TABLE library_item ADD COLUMN folder TEXT DEFAULT 'inbox';
--
-- -- Populate folder based on state
-- UPDATE library_item
-- SET folder = CASE
--   WHEN state = 'ARCHIVED' THEN 'archive'
--   WHEN state = 'DELETED' THEN 'trash'
--   ELSE 'inbox'
-- END;
--
-- -- Recreate content_reader column with default values
-- ALTER TABLE library_item ADD COLUMN content_reader VARCHAR(20) DEFAULT 'WEB';
--
-- -- Populate content_reader based on item_type
-- UPDATE library_item
-- SET content_reader = CASE
--   WHEN item_type = 'pdf' THEN 'PDF'
--   ELSE 'WEB'
-- END;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- After running this migration, verify the changes:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'library_item'
-- ORDER BY ordinal_position;
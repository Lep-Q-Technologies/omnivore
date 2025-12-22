-- Undo migration: Remove pending_confirmation table

DROP TABLE IF EXISTS omnivore.pending_confirmation CASCADE;

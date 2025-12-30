/**
 * Folder constants for library items
 * Use these constants instead of magic strings to ensure type safety and consistency
 */

export const FOLDERS = {
  INBOX: 'inbox',
  ARCHIVE: 'archive',
  TRASH: 'trash',
  FOLLOWING: 'following', // Virtual folder for RSS feed items
  ALL: 'all', // Virtual folder for viewing all items
} as const

// Type-safe folder name from const assertion
export type FolderName = (typeof FOLDERS)[keyof typeof FOLDERS]

// Array of valid folder names (excluding 'all' which is a virtual folder)
export const VALID_FOLDERS = [
  FOLDERS.INBOX,
  FOLDERS.ARCHIVE,
  FOLDERS.TRASH,
] as const

// Array of all folder names including virtual folders
export const ALL_FOLDERS = [
  FOLDERS.INBOX,
  FOLDERS.ARCHIVE,
  FOLDERS.TRASH,
  FOLDERS.FOLLOWING,
  FOLDERS.ALL,
] as const

/**
 * Type guard to check if a string is a valid folder name
 * @param folder - The string to check
 * @returns True if the folder is one of the valid folder names (including virtual folders)
 */
export function isValidFolder(folder: string): folder is FolderName {
  return ALL_FOLDERS.includes(folder as FolderName)
}

/**
 * Type guard to check if a string is a valid physical folder (not virtual)
 * Physical folders are those that store actual items (inbox, archive, trash)
 * Virtual folders like 'all' and 'following' are excluded
 * @param folder - The string to check
 * @returns True if the folder is a physical folder (inbox, archive, or trash)
 */
export function isPhysicalFolder(
  folder: string,
): folder is (typeof VALID_FOLDERS)[number] {
  return VALID_FOLDERS.includes(folder as (typeof VALID_FOLDERS)[number])
}

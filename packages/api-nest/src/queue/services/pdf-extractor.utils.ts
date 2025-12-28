/**
 * PDF Extractor Utility Functions
 *
 * Pure utility functions for PDF text processing and metadata extraction.
 * Separated from service for testability and reusability.
 */

import { createHash } from 'crypto'

/**
 * Calculate word count from text
 */
export function calculateWordCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0
  }

  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

  return words.length
}

/**
 * Clean up PDF text (remove excessive whitespace, normalize)
 */
export function cleanPdfText(text: string): string {
  if (!text) {
    return ''
  }

  return (
    text
      // Replace multiple spaces with single space
      .replace(/ {2,}/g, ' ')
      // Replace multiple newlines with double newline (paragraph break)
      .replace(/\n{3,}/g, '\n\n')
      // Remove carriage returns
      .replace(/\r/g, '')
      // Trim whitespace from each line
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Final trim
      .trim()
  )
}

/**
 * Generate SHA-256 hash of content
 */
export function generateContentHash(content: string): string {
  if (!content) {
    return ''
  }

  return createHash('sha256').update(content).digest('hex')
}

/**
 * Extract title from PDF metadata or URL
 */
export function extractTitle(
  metadata: Record<string, string | undefined>,
  url: string,
): string {
  // Try metadata title first
  if (metadata.Title && metadata.Title.trim()) {
    return metadata.Title.trim()
  }

  // Try subject
  if (metadata.Subject && metadata.Subject.trim()) {
    return metadata.Subject.trim()
  }

  // Fall back to filename from URL
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop() || 'Untitled PDF'
    // Remove .pdf extension

    return filename.replace(/\.pdf$/i, '')
  } catch {
    return 'Untitled PDF'
  }
}

/**
 * Parse PDF date format (D:YYYYMMDDHHmmSS)
 */
export function parseDate(dateString: string | null): Date | null {
  if (!dateString) {
    return null
  }

  try {
    // PDF date format: D:YYYYMMDDHHmmSS+HH'mm' or D:YYYYMMDDHHmmSSZ
    const match = dateString.match(
      /D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
    )
    if (match) {
      const [, year, month, day, hour, minute, second] = match

      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
        parseInt(second, 10),
      )
    }

    // Try parsing as ISO date
    const parsed = new Date(dateString)

    return isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

/**
 * Check if buffer is a valid PDF (starts with %PDF magic bytes)
 */
export function isPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false
  }

  return buffer.toString('utf-8', 0, 4) === '%PDF'
}

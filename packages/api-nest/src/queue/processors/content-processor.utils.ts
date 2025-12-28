/**
 * Content Processor Utility Functions
 *
 * Pure utility functions for content processing.
 * Separated from service for testability and reusability.
 */

import { createHash } from 'crypto'
import { parseHTML } from 'linkedom'

/**
 * Calculate word count from HTML content
 * Parses HTML to decode entities (e.g., &nbsp;, &amp;) before counting words
 *
 * @param htmlContent - HTML content to count words from
 * @returns Actual word count
 */
export function calculateWordCount(htmlContent: string): number {
  if (!htmlContent) {
    return 0
  }

  try {
    // Readability returns HTML fragment (DIV), not a complete document
    // Wrap it in a proper HTML structure so linkedom can parse it correctly
    const wrappedHtml = `<!DOCTYPE html><html><body>${htmlContent}</body></html>`

    // Parse HTML to decode entities and extract text content
    const { document } = parseHTML(wrappedHtml)
    const textOnly = document.body?.textContent || ''

    // Remove extra whitespace and normalize
    const normalized = textOnly.replace(/\s+/g, ' ').trim()
    if (!normalized) {
      return 0
    }

    // Split by whitespace and count non-empty words
    const words = normalized.split(' ').filter((word) => word.length > 0)

    return words.length
  } catch {
    return 0
  }
}

/**
 * Generate SHA-256 hash of content for duplicate detection
 *
 * @param content - Content to hash
 * @returns SHA-256 hash as hex string
 */
export function generateContentHash(content: string): string {
  if (!content) {
    return ''
  }

  try {
    return createHash('sha256').update(content).digest('hex')
  } catch {
    return ''
  }
}

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param text - Text to escape
 * @returns Escaped text safe for HTML insertion
 */
export function escapeHtml(text: string): string {
  if (!text) {
    return ''
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }

  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Convert PDF plain text to HTML format for consistent storage
 *
 * @param text - Plain text from PDF
 * @param pageCount - Optional page count for metadata
 * @returns HTML formatted content
 */
export function convertPdfTextToHtml(text: string, pageCount?: number): string {
  if (!text) {
    return ''
  }

  // Split into paragraphs (double newline = paragraph break)
  const paragraphs = text.split('\n\n').filter((p) => p.trim().length > 0)

  // Wrap each paragraph in <p> tags
  const htmlParagraphs = paragraphs
    .map((para) => {
      // Replace single newlines with <br> within paragraphs
      const withBreaks = para.replace(/\n/g, '<br>')

      return `<p>${withBreaks}</p>`
    })
    .join('\n')

  // Wrap in a div with metadata
  let html = '<div class="pdf-content">\n'

  if (pageCount) {
    html += `<div class="pdf-metadata">Pages: ${pageCount}</div>\n`
  }

  html += htmlParagraphs
  html += '\n</div>'

  return html
}

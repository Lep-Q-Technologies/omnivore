/**
 * PDF Extractor Utilities Unit Tests
 */

import {
  calculateWordCount,
  cleanPdfText,
  extractTitle,
  generateContentHash,
  isPdfBuffer,
  parseDate,
} from './pdf-extractor.utils'

describe('PDF Extractor Utilities', () => {
  describe('calculateWordCount', () => {
    it('should count words in simple text', () => {
      const text = 'Hello world this is a test'
      expect(calculateWordCount(text)).toBe(6)
    })

    it('should handle empty text', () => {
      expect(calculateWordCount('')).toBe(0)
      expect(calculateWordCount('   ')).toBe(0)
    })

    it('should handle text with multiple spaces', () => {
      const text = 'Hello    world    test'
      expect(calculateWordCount(text)).toBe(3)
    })

    it('should handle text with newlines', () => {
      const text = 'Hello\nworld\ntest'
      expect(calculateWordCount(text)).toBe(3)
    })
  })

  describe('cleanPdfText', () => {
    it('should remove excessive whitespace', () => {
      const text = 'Hello    world    test'
      expect(cleanPdfText(text)).toBe('Hello world test')
    })

    it('should normalize multiple newlines', () => {
      const text = 'Paragraph 1\n\n\n\nParagraph 2'
      expect(cleanPdfText(text)).toBe('Paragraph 1\n\nParagraph 2')
    })

    it('should remove carriage returns', () => {
      const text = 'Hello\r\nworld\r\n'
      expect(cleanPdfText(text)).toBe('Hello\nworld')
    })

    it('should trim whitespace from lines', () => {
      const text = '  Hello  \n  World  \n  Test  '
      expect(cleanPdfText(text)).toBe('Hello\nWorld\nTest')
    })

    it('should handle empty text', () => {
      expect(cleanPdfText('')).toBe('')
      expect(cleanPdfText('   ')).toBe('')
    })
  })

  describe('generateContentHash', () => {
    it('should generate SHA-256 hash', () => {
      const content = 'test content'
      const hash = generateContentHash(content)
      expect(hash).toBeTruthy()
      expect(hash.length).toBe(64) // SHA-256 produces 64 hex characters
    })

    it('should generate same hash for same content', () => {
      const content = 'test content'
      const hash1 = generateContentHash(content)
      const hash2 = generateContentHash(content)
      expect(hash1).toBe(hash2)
    })

    it('should generate different hash for different content', () => {
      const hash1 = generateContentHash('content 1')
      const hash2 = generateContentHash('content 2')
      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty content', () => {
      expect(generateContentHash('')).toBe('')
    })
  })

  describe('extractTitle', () => {
    it('should extract title from metadata', () => {
      const metadata = { Title: 'Test Document' }
      const url = 'https://example.com/doc.pdf'
      expect(extractTitle(metadata, url)).toBe('Test Document')
    })

    it('should trim whitespace from title', () => {
      const metadata = { Title: '  Test Document  ' }
      const url = 'https://example.com/doc.pdf'
      expect(extractTitle(metadata, url)).toBe('Test Document')
    })

    it('should fall back to Subject if no Title', () => {
      const metadata = { Subject: 'Test Subject' }
      const url = 'https://example.com/doc.pdf'
      expect(extractTitle(metadata, url)).toBe('Test Subject')
    })

    it('should extract filename from URL if no metadata', () => {
      const metadata = {}
      const url = 'https://example.com/my-document.pdf'
      expect(extractTitle(metadata, url)).toBe('my-document')
    })

    it('should handle URL without .pdf extension', () => {
      const metadata = {}
      const url = 'https://example.com/document'
      expect(extractTitle(metadata, url)).toBe('document')
    })

    it('should return default for invalid URL', () => {
      const metadata = {}
      const url = 'invalid-url'
      expect(extractTitle(metadata, url)).toBe('Untitled PDF')
    })
  })

  describe('parseDate', () => {
    it('should parse PDF date format', () => {
      const dateString = 'D:20250123143000'
      const parsed = parseDate(dateString)
      expect(parsed).toBeInstanceOf(Date)
      expect(parsed?.getFullYear()).toBe(2025)
      expect(parsed?.getMonth()).toBe(0) // January (0-indexed)
      expect(parsed?.getDate()).toBe(23)
      expect(parsed?.getHours()).toBe(14)
      expect(parsed?.getMinutes()).toBe(30)
    })

    it('should handle undefined date', () => {
      expect(parseDate(undefined)).toBeUndefined()
    })

    it('should handle invalid date format', () => {
      expect(parseDate('invalid-date')).toBeUndefined()
    })

    it('should try parsing as ISO date', () => {
      const dateString = '2025-01-23T14:30:00Z'
      const parsed = parseDate(dateString)
      expect(parsed).toBeInstanceOf(Date)
    })
  })

  describe('isPdfBuffer', () => {
    it('should recognize valid PDF buffer', () => {
      const buffer = Buffer.from('%PDF-1.4\n...')
      expect(isPdfBuffer(buffer)).toBe(true)
    })

    it('should reject buffer without PDF magic bytes', () => {
      const buffer = Buffer.from('Not a PDF')
      expect(isPdfBuffer(buffer)).toBe(false)
    })

    it('should reject empty buffer', () => {
      const buffer = Buffer.from('')
      expect(isPdfBuffer(buffer)).toBe(false)
    })

    it('should reject buffer too short', () => {
      const buffer = Buffer.from('%PD')
      expect(isPdfBuffer(buffer)).toBe(false)
    })
  })
})

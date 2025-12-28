/**
 * PdfExtractorService Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing'

import { PdfExtractorService } from './pdf-extractor.service'

describe('PdfExtractorService', () => {
  let service: PdfExtractorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfExtractorService],
    }).compile()

    service = module.get<PdfExtractorService>(PdfExtractorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateWordCount', () => {
    it('should count words in simple text', () => {
      const text = 'Hello world this is a test'
      const count = service.calculateWordCount(text)
      expect(count).toBe(6)
    })

    it('should handle empty text', () => {
      expect(service.calculateWordCount('')).toBe(0)
      expect(service.calculateWordCount('   ')).toBe(0)
    })

    it('should handle text with multiple spaces', () => {
      const text = 'Hello    world    test'
      const count = service.calculateWordCount(text)
      expect(count).toBe(3)
    })

    it('should handle text with newlines', () => {
      const text = 'Hello\nworld\ntest'
      const count = service.calculateWordCount(text)
      expect(count).toBe(3)
    })
  })

  describe('cleanPdfText', () => {
    it('should remove excessive whitespace', () => {
      const text = 'Hello    world    test'
      const cleaned = service.cleanPdfText(text)
      expect(cleaned).toBe('Hello world test')
    })

    it('should normalize multiple newlines', () => {
      const text = 'Paragraph 1\n\n\n\nParagraph 2'
      const cleaned = service.cleanPdfText(text)
      expect(cleaned).toBe('Paragraph 1\n\nParagraph 2')
    })

    it('should remove carriage returns', () => {
      const text = 'Hello\r\nworld\r\n'
      const cleaned = service.cleanPdfText(text)
      expect(cleaned).toBe('Hello\nworld')
    })

    it('should trim whitespace from lines', () => {
      const text = '  Hello  \n  World  \n  Test  '
      const cleaned = service.cleanPdfText(text)
      expect(cleaned).toBe('Hello\nWorld\nTest')
    })

    it('should handle empty text', () => {
      expect(service.cleanPdfText('')).toBe('')
      expect(service.cleanPdfText('   ')).toBe('')
    })
  })

  describe('generateContentHash', () => {
    it('should generate SHA-256 hash', () => {
      const content = 'test content'
      const hash = service.generateContentHash(content)
      expect(hash).toBeTruthy()
      expect(hash.length).toBe(64) // SHA-256 produces 64 hex characters
    })

    it('should generate same hash for same content', () => {
      const content = 'test content'
      const hash1 = service.generateContentHash(content)
      const hash2 = service.generateContentHash(content)
      expect(hash1).toBe(hash2)
    })

    it('should generate different hash for different content', () => {
      const hash1 = service.generateContentHash('content 1')
      const hash2 = service.generateContentHash('content 2')
      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty content', () => {
      const hash = service.generateContentHash('')
      expect(hash).toBe('')
    })
  })

  describe('extractTitle', () => {
    it('should extract title from metadata', () => {
      const metadata = { Title: 'Test Document' }
      const url = 'https://example.com/doc.pdf'
      const title = service.extractTitle(metadata, url)
      expect(title).toBe('Test Document')
    })

    it('should trim whitespace from title', () => {
      const metadata = { Title: '  Test Document  ' }
      const url = 'https://example.com/doc.pdf'
      const title = service.extractTitle(metadata, url)
      expect(title).toBe('Test Document')
    })

    it('should fall back to Subject if no Title', () => {
      const metadata = { Subject: 'Test Subject' }
      const url = 'https://example.com/doc.pdf'
      const title = service.extractTitle(metadata, url)
      expect(title).toBe('Test Subject')
    })

    it('should extract filename from URL if no metadata', () => {
      const metadata = {}
      const url = 'https://example.com/my-document.pdf'
      const title = service.extractTitle(metadata, url)
      expect(title).toBe('my-document')
    })

    it('should handle URL without .pdf extension', () => {
      const metadata = {}
      const url = 'https://example.com/document'
      const title = service.extractTitle(metadata, url)
      expect(title).toBe('document')
    })

    it('should return default for invalid URL', () => {
      const metadata = {}
      const url = 'invalid-url'
      const title = service.extractTitle(metadata, url)
      expect(title).toBe('Untitled PDF')
    })
  })

  describe('parseDate', () => {
    it('should parse PDF date format', () => {
      const dateString = 'D:20250123143000'
      const parsed = service.parseDate(dateString)
      expect(parsed).toBeInstanceOf(Date)
      expect(parsed?.getFullYear()).toBe(2025)
      expect(parsed?.getMonth()).toBe(0) // January (0-indexed)
      expect(parsed?.getDate()).toBe(23)
      expect(parsed?.getHours()).toBe(14)
      expect(parsed?.getMinutes()).toBe(30)
    })

    it('should handle undefined date', () => {
      const parsed = service.parseDate(undefined)
      expect(parsed).toBeUndefined()
    })

    it('should handle invalid date format', () => {
      const parsed = service.parseDate('invalid-date')
      expect(parsed).toBeUndefined()
    })

    it('should try parsing as ISO date', () => {
      const dateString = '2025-01-23T14:30:00Z'
      const parsed = service.parseDate(dateString)
      expect(parsed).toBeInstanceOf(Date)
    })
  })

  describe('isPdfBuffer', () => {
    it('should recognize valid PDF buffer', () => {
      const buffer = Buffer.from('%PDF-1.4\n...')
      const isPdf = service.isPdfBuffer(buffer)
      expect(isPdf).toBe(true)
    })

    it('should reject buffer without PDF magic bytes', () => {
      const buffer = Buffer.from('Not a PDF')
      const isPdf = service.isPdfBuffer(buffer)
      expect(isPdf).toBe(false)
    })

    it('should reject empty buffer', () => {
      const buffer = Buffer.from('')
      const isPdf = service.isPdfBuffer(buffer)
      expect(isPdf).toBe(false)
    })

    it('should reject buffer too short', () => {
      const buffer = Buffer.from('%PD')
      const isPdf = service.isPdfBuffer(buffer)
      expect(isPdf).toBe(false)
    })
  })

  describe('extractPdf', () => {
    it('should handle download errors gracefully', async () => {
      const result = await service.extractPdf(
        'https://invalid-url-that-does-not-exist.com/file.pdf',
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.contentType).toBe('application/pdf')
    })

    // Note: Real PDF extraction tests would require actual PDF files
    // These should be tested in E2E tests with real PDF URLs
  })
})

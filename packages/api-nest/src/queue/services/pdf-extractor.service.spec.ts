/**
 * PdfExtractorService Unit Tests
 *
 * Tests the public interface (extractPdf) only.
 * Utility function tests are in pdf-extractor.utils.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing'

import { PdfExtractorService } from './pdf-extractor.service'

describe('PdfExtractorService', () => {
  let service: PdfExtractorService | null = null

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfExtractorService],
    }).compile()

    service = module.get<PdfExtractorService>(PdfExtractorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
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

    it('should return error for non-PDF content', async () => {
      // Using a URL that returns HTML instead of PDF
      const result = await service.extractPdf('https://example.com/')

      expect(result.success).toBe(false)
      expect(result.contentType).toBe('application/pdf')
    })

    // Note: Real PDF extraction tests with actual PDF files
    // should be in E2E tests with controlled test fixtures
  })
})

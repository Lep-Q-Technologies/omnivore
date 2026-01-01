/**
 * PdfExtractorService Unit Tests
 *
 * Tests the public interface (extractPdf) only.
 * Utility function tests are in pdf-extractor.utils.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing'
import fetch from 'cross-fetch'

import { PdfExtractorService } from './pdf-extractor.service'

// Mock cross-fetch
jest.mock('cross-fetch')
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('PdfExtractorService', () => {
  let service: PdfExtractorService | null = null

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks()

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
      // Mock fetch to reject with a network error
      mockFetch.mockRejectedValue(new Error('ENOTFOUND'))

      const result = await service.extractPdf(
        'https://invalid-url-that-does-not-exist.com/file.pdf',
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.contentType).toBe('application/pdf')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should return error for non-PDF content', async () => {
      // Mock fetch to return HTML content
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        } as unknown as Headers,
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(
            Buffer.from('<html><body>Not a PDF</body></html>'),
          ),
      } as unknown as Response)

      const result = await service.extractPdf('https://example.com/')

      expect(result.success).toBe(false)
      expect(result.contentType).toBe('application/pdf')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle HTTP errors', async () => {
      // Mock fetch to return a 404 error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response)

      const result = await service.extractPdf('https://example.com/missing.pdf')

      expect(result.success).toBe(false)
      expect(result.error).toContain('404')
      expect(result.contentType).toBe('application/pdf')
    })

    // Note: Real PDF extraction tests with actual PDF files
    // should be in E2E tests with controlled test fixtures
  })
})

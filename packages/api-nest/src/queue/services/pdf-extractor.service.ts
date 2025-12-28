/**
 * PdfExtractorService - Extract text and metadata from PDF documents
 *
 * Uses pdf-parse to extract text content from PDF files for indexing and reading.
 */

import { Injectable, Logger } from '@nestjs/common'
import fetch from 'cross-fetch'
import pdfParse from 'pdf-parse'

import {
  calculateWordCount,
  cleanPdfText,
  extractTitle,
  generateContentHash,
  isPdfBuffer,
  parseDate,
} from './pdf-extractor.utils'

/**
 * Result of PDF extraction operation
 */
export interface PdfExtractionResult {
  success: boolean
  title?: string
  author?: string
  content?: string // Extracted text content
  contentType: 'application/pdf'
  pageCount?: number
  wordCount?: number
  contentHash?: string
  createdDate?: Date
  modifiedDate?: Date
  error?: string
  warnings?: string[]
}

/**
 * PDF extraction configuration
 */
interface PdfExtractorConfig {
  maxSizeBytes: number // Maximum PDF size to process
  timeoutMs: number // Download timeout
}

@Injectable()
export class PdfExtractorService {
  private readonly logger = new Logger(PdfExtractorService.name)

  private readonly config: PdfExtractorConfig = {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB limit
    timeoutMs: 30000, // 30 seconds
  }

  /**
   * Extract text and metadata from PDF URL
   *
   * @param url - URL of the PDF document
   * @returns PDF extraction result
   */
  async extractPdf(url: string): Promise<PdfExtractionResult> {
    this.logger.log(`Extracting PDF from ${url}`)
    const warnings: string[] = []

    try {
      // Step 1: Download PDF file
      this.logger.debug(`Downloading PDF from ${url}`)
      const pdfBuffer = await this.downloadPdf(url)

      if (!pdfBuffer || pdfBuffer.length === 0) {
        return {
          success: false,
          contentType: 'application/pdf',
          error: 'Downloaded PDF is empty',
        }
      }

      this.logger.debug(
        `Downloaded PDF: ${pdfBuffer.length} bytes (${(
          pdfBuffer.length / 1024
        ).toFixed(2)} KB)`,
      )

      // Step 2: Parse PDF with pdf-parse
      this.logger.debug('Parsing PDF content')
      const pdfData = await pdfParse(pdfBuffer, {
        // Limit text extraction to reasonable size
        max: 0, // 0 = no limit, extract all pages
      })

      // Step 3: Extract metadata
      const metadata = pdfData.info || {}
      this.logger.debug(`PDF metadata: ${JSON.stringify(metadata)}`)

      // Step 4: Extract and clean text content
      let textContent = pdfData.text || ''

      // Clean up excessive whitespace
      textContent = cleanPdfText(textContent)

      if (!textContent || textContent.trim().length === 0) {
        warnings.push(
          'No text content found - PDF may be scanned/image-based or encrypted',
        )
        this.logger.warn(
          `PDF at ${url} has no extractable text (possibly scanned PDF)`,
        )
      }

      // Step 5: Calculate word count
      const wordCount = calculateWordCount(textContent)

      // Step 6: Generate content hash
      const contentHash = generateContentHash(textContent)

      // Step 7: Extract title (from metadata or URL)
      const title = extractTitle(metadata, url)

      // Step 8: Extract dates
      const createdDate = parseDate(metadata.CreationDate)
      const modifiedDate = parseDate(metadata.ModDate)

      this.logger.log(
        `Successfully extracted PDF: ${pdfData.numpages} pages, ${wordCount} words`,
      )

      return {
        success: true,
        title,
        author: metadata.Author || metadata.Creator,
        content: textContent,
        contentType: 'application/pdf',
        pageCount: pdfData.numpages,
        wordCount,
        contentHash,
        createdDate,
        modifiedDate,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to extract PDF from ${url}: ${errorMessage}`)

      return {
        success: false,
        contentType: 'application/pdf',
        error: errorMessage,
        warnings,
      }
    }
  }

  /**
   * Download PDF file from URL
   */
  private async downloadPdf(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/pdf,*/*',
        },
        signal: AbortSignal.timeout(this.config.timeoutMs),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check Content-Type
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('pdf')) {
        this.logger.warn(
          `URL ${url} returned Content-Type: ${contentType} (expected application/pdf)`,
        )
      }

      // Check file size
      const contentLength = response.headers.get('content-length')
      if (
        contentLength &&
        parseInt(contentLength, 10) > this.config.maxSizeBytes
      ) {
        throw new Error(
          `PDF file too large: ${contentLength} bytes (max: ${this.config.maxSizeBytes})`,
        )
      }

      // Read response as buffer
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Verify it's actually a PDF (check magic bytes)
      if (!isPdfBuffer(buffer)) {
        throw new Error('Downloaded file is not a valid PDF (invalid header)')
      }

      return buffer
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`PDF download timeout after ${this.config.timeoutMs}ms`)
      }
      throw error
    }
  }
}

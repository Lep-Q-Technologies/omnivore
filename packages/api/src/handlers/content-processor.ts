import { isFeatureEnabled } from '../config/features'
import { getDeploymentConfig } from '../config/deployment'
import { logger } from '../utils/logger'

// Import existing job handlers
import { findThumbnail } from '../jobs/find_thumbnail'
import { updatePdfContent } from '../jobs/update_pdf_content'

// Types for content processing
export interface ContentProcessingRequest {
  url: string
  userId: string
  saveRequestId: string
  priority?: number
  source?: string
}

export interface ContentProcessingResult {
  content?: string
  title?: string
  author?: string
  description?: string
  previewImage?: string
  publishedAt?: Date
  siteName?: string
  contentType?: string
  error?: string
}

export class ContentProcessor {
  private config = getDeploymentConfig()

  async processContent(request: ContentProcessingRequest): Promise<ContentProcessingResult> {
    try {
      logger.info('Processing content', { 
        url: request.url, 
        userId: request.userId,
        features: this.config.features 
      })

      // Basic content fetching (always enabled)
      const result = await this.fetchContent(request)

      // PDF processing if enabled
      if (isFeatureEnabled('pdfProcessing') && this.isPdfUrl(request.url)) {
        return await this.processPdf(request)
      }

      // Thumbnail generation if enabled
      if (isFeatureEnabled('thumbnailGeneration') && result.content) {
        result.previewImage = await this.generateThumbnail(request.url, request.userId)
      }

      // Browser-based parsing if content processing is enabled
      if (isFeatureEnabled('contentProcessing')) {
        const parsedContent = await this.parseWithBrowser(request.url)
        if (parsedContent) {
          Object.assign(result, parsedContent)
        }
      }

      return result
    } catch (error) {
      logger.error('Content processing failed', { 
        error: error.message, 
        url: request.url,
        userId: request.userId 
      })
      return { error: error.message }
    }
  }

  private async fetchContent(request: ContentProcessingRequest): Promise<ContentProcessingResult> {
    // Basic HTTP content fetching
    // This replaces the content-fetch service functionality
    const response = await fetch(request.url, {
      headers: {
        'User-Agent': 'Omnivore/1.0 (Content Reader)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    const content = await response.text()

    return {
      content,
      contentType,
      title: this.extractTitle(content),
      description: this.extractDescription(content),
    }
  }

  private async parseWithBrowser(url: string): Promise<Partial<ContentProcessingResult>> {
    // This replaces puppeteer-parse service functionality
    if (!isFeatureEnabled('contentProcessing')) {
      return {}
    }

    try {
      // Import puppeteer dynamically to avoid loading if not needed
      const puppeteer = await import('puppeteer-core')
      const { ContentHandler } = await import('@omnivore/content-handler')

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })

      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

      const content = await page.content()
      const handler = new ContentHandler()
      const parsed = await handler.parse(content, url)

      await browser.close()

      return {
        content: parsed.content,
        title: parsed.title,
        author: parsed.author,
        description: parsed.description,
        publishedAt: parsed.publishedAt,
        siteName: parsed.siteName,
      }
    } catch (error) {
      logger.warn('Browser parsing failed, falling back to basic parsing', { 
        error: error.message, 
        url 
      })
      return {}
    }
  }

  private async processPdf(request: ContentProcessingRequest): Promise<ContentProcessingResult> {
    // This replaces pdf-handler service functionality
    if (!isFeatureEnabled('pdfProcessing')) {
      throw new Error('PDF processing is disabled')
    }

    try {
      // Use existing PDF processing job
      const result = await updatePdfContent({
        data: {
          url: request.url,
          userId: request.userId,
          saveRequestId: request.saveRequestId,
        },
      } as any)

      return {
        content: result.content,
        title: result.title || 'PDF Document',
        contentType: 'application/pdf',
      }
    } catch (error) {
      logger.error('PDF processing failed', { error: error.message, url: request.url })
      throw error
    }
  }

  private async generateThumbnail(url: string, userId: string): Promise<string | undefined> {
    // This replaces thumbnail-handler service functionality
    if (!isFeatureEnabled('thumbnailGeneration')) {
      return undefined
    }

    try {
      // Use existing thumbnail job
      const result = await findThumbnail({
        data: {
          url,
          userId,
        },
      } as any)

      return result.thumbnail
    } catch (error) {
      logger.warn('Thumbnail generation failed', { error: error.message, url })
      return undefined
    }
  }

  private isPdfUrl(url: string): boolean {
    return url.toLowerCase().includes('.pdf') || 
           url.toLowerCase().includes('content-type=application/pdf')
  }

  private extractTitle(html: string): string | undefined {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return titleMatch ? titleMatch[1].trim() : undefined
  }

  private extractDescription(html: string): string | undefined {
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    return descMatch ? descMatch[1].trim() : undefined
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; features: string[] }> {
    const enabledFeatures = []
    
    if (isFeatureEnabled('contentProcessing')) enabledFeatures.push('content-processing')
    if (isFeatureEnabled('pdfProcessing')) enabledFeatures.push('pdf-processing')
    if (isFeatureEnabled('thumbnailGeneration')) enabledFeatures.push('thumbnail-generation')

    return {
      status: 'healthy',
      features: enabledFeatures,
    }
  }
}

// Export singleton instance
export const contentProcessor = new ContentProcessor()
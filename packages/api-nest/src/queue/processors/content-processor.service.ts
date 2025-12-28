/**
 * ContentProcessorService - BullMQ Worker for Content Processing
 *
 * Processes jobs from the content-processing queue to fetch and parse
 * web content for saved library items.
 */

import { Readability } from '@mozilla/readability'
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Job } from 'bullmq'
import fetch from 'cross-fetch'
import { parseHTML } from 'linkedom'
import { Repository } from 'typeorm'

import {
  ContentType,
  LibraryItemEntity,
  LibraryItemState,
} from '../../library/entities/library-item.entity'
import { EventBusService } from '../event-bus.service'
import { EVENT_NAMES } from '../events.constants'
import { JOB_CONFIG, JOB_TYPES, QUEUE_NAMES } from '../queue.constants'
import { ContentTypeDetectorService } from '../services/content-type-detector.service'
import { HtmlSanitizerService } from '../services/html-sanitizer.service'
import { PdfExtractorService } from '../services/pdf-extractor.service'
import { RssFeedResult, RssFeedService } from '../services/rss-feed.service'
import { TwitterExtractorService } from '../services/twitter-extractor.service'
import { VideoExtractorService } from '../services/video-extractor.service'
import {
  calculateWordCount,
  convertPdfTextToHtml,
  escapeHtml,
  generateContentHash,
} from './content-processor.utils'

/**
 * Job data interface for fetch-content jobs
 */
export interface FetchContentJobData {
  libraryItemId: string
  url: string
  userId: string
  source?: 'web' | 'mobile' | 'api' | 'extension'
  timestamp: Date
}

/**
 * Result of content fetching operation
 */
export interface ContentFetchResult {
  success: boolean
  title?: string
  content?: string
  contentType?: string
  author?: string
  publishedDate?: Date
  siteIcon?: string
  thumbnail?: string
  description?: string
  siteName?: string
  wordCount?: number
  contentHash?: string
  error?: string
}

@Injectable()
@Processor(QUEUE_NAMES.CONTENT_PROCESSING, {
  concurrency: JOB_CONFIG.WORKER_CONCURRENCY,
})
export class ContentProcessorService
  extends WorkerHost
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ContentProcessorService.name)

  constructor(
    @InjectRepository(LibraryItemEntity)
    private readonly libraryItemRepository: Repository<LibraryItemEntity>,
    private readonly eventBus: EventBusService,
    private readonly htmlSanitizer: HtmlSanitizerService,
    private readonly contentTypeDetector: ContentTypeDetectorService,
    private readonly pdfExtractor: PdfExtractorService,
    private readonly rssFeedService: RssFeedService,
    private readonly videoExtractor: VideoExtractorService,
    private readonly twitterExtractor: TwitterExtractorService,
  ) {
    super()
  }

  onModuleInit() {
    this.logger.log(
      `ContentProcessorService initialized with concurrency ${JOB_CONFIG.WORKER_CONCURRENCY}`,
    )
  }

  async onModuleDestroy() {
    this.logger.log('ContentProcessorService shutting down...')
    try {
      // Close the worker gracefully
      await this.worker?.close()
      this.logger.log('ContentProcessorService shut down successfully')
    } catch (error) {
      this.logger.error(
        `Error during ContentProcessorService shutdown: ${error}`,
      )
    }
  }

  /**
   * Main job processing method
   * Called by BullMQ for each job
   */
  async process(
    job: Job<FetchContentJobData, ContentFetchResult, string>,
  ): Promise<ContentFetchResult> {
    const { libraryItemId } = job.data

    this.logger.log(
      `Processing job ${job.id} for item ${libraryItemId} (attempt ${
        job.attemptsMade + 1
      }/${job.opts.attempts})`,
    )

    // Route to appropriate handler based on job name
    switch (job.name) {
      case JOB_TYPES.FETCH_CONTENT:
        return this.handleFetchContent(job)
      case JOB_TYPES.PARSE_CONTENT:
        return this.handleParseContent(job)
      default:
        throw new Error(`Unknown job type: ${job.name}`)
    }
  }

  /**
   * Handle fetch-content jobs
   */
  private async handleFetchContent(
    job: Job<FetchContentJobData>,
  ): Promise<ContentFetchResult> {
    const { libraryItemId, url } = job.data
    const startTime = Date.now()

    try {
      // Emit fetch started event
      this.eventBus.emitContentFetchStarted({
        eventType: EVENT_NAMES.CONTENT_FETCH_STARTED,
        libraryItemId,
        url,
        jobId: job.id ?? 'unknown',
        timestamp: new Date(),
      })

      // Update job progress
      await job.updateProgress(10)

      // Detect content type from URL
      const detection = await this.contentTypeDetector.detectContentType(url)
      this.logger.log(
        `Detected content type: ${detection.contentType} (confidence: ${detection.confidence}) for ${url}`,
      )
      await job.updateProgress(15)

      // Update library item state to PROCESSING and set content type
      await this.libraryItemRepository.update(libraryItemId, {
        state: LibraryItemState.PROCESSING,
        contentType: detection.contentType,
      })
      await job.updateProgress(20)

      // Route to appropriate content extractor based on type
      let result: ContentFetchResult = { success: false }
      switch (detection.contentType) {
        case ContentType.PDF:
          result = await this.fetchPdfContent(url, job)
          break
        case ContentType.RSS_FEED:
          result = await this.fetchRssFeed(url, job)
          break
        case ContentType.VIDEO:
          result = await this.fetchVideoTranscript(url, job, detection.metadata)
          break
        case ContentType.TWITTER:
          result = await this.fetchTwitterThread(url, job, detection.metadata)
          break
        case ContentType.ARTICLE:
        case ContentType.UNKNOWN:
        default:
          // Default to web article extraction
          result = await this.fetchWebArticle(url, job)
          break
      }

      if (!result.success) {
        throw new Error(result.error || 'Content fetch failed')
      }

      await job.updateProgress(70)

      // Save content to database
      await this.saveContent(libraryItemId, result)
      await job.updateProgress(90)

      // Update library item state to SUCCEEDED
      await this.updateLibraryItemState(
        libraryItemId,
        LibraryItemState.SUCCEEDED,
      )
      await job.updateProgress(100)

      const processingTime = Date.now() - startTime

      // Emit fetch completed event
      this.eventBus.emitContentFetchCompleted({
        eventType: EVENT_NAMES.CONTENT_FETCH_COMPLETED,
        libraryItemId,
        jobId: job.id ?? 'unknown',
        contentLength: result.content?.length ?? 0,
        processingTime,
        timestamp: new Date(),
      })

      this.logger.log(
        `Successfully processed job ${job.id} for item ${libraryItemId} in ${processingTime}ms`,
      )

      return result
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const willRetry = job.attemptsMade + 1 < (job.opts.attempts || 1)

      this.logger.error(
        `Job ${job.id} failed for item ${libraryItemId}: ${errorMessage} ` +
          `(attempt ${job.attemptsMade + 1}/${
            job.opts.attempts
          }, will retry: ${willRetry})`,
      )

      // Update library item state to FAILED if final attempt
      if (!willRetry) {
        await this.updateLibraryItemState(
          libraryItemId,
          LibraryItemState.FAILED,
        )
      }

      // Emit fetch failed event
      this.eventBus.emitContentFetchFailed({
        eventType: EVENT_NAMES.CONTENT_FETCH_FAILED,
        libraryItemId,
        jobId: job.id ?? 'unknown',
        userId: job.data.userId,
        error: errorMessage,
        retryCount: job.attemptsMade + 1,
        willRetry,
        timestamp: new Date(),
      })

      throw error
    }
  }

  /**
   * Handle parse-content jobs (future implementation)
   */
  private async handleParseContent(
    job: Job<FetchContentJobData>,
  ): Promise<ContentFetchResult> {
    this.logger.log(`Parse content job ${job.id} - Not implemented yet`)
    // TODO: Implement content parsing in Phase 3

    return { success: true }
  }

  /**
   * Fetch PDF document content
   * Extracts text and metadata from PDF files
   */
  private async fetchPdfContent(
    url: string,
    job: Job<FetchContentJobData>,
  ): Promise<ContentFetchResult> {
    this.logger.log(`Extracting PDF content from ${url}`)

    try {
      await job.updateProgress(30)

      // Extract PDF using PdfExtractorService
      const pdfResult = await this.pdfExtractor.extractPdf(url)
      await job.updateProgress(70)

      if (!pdfResult.success) {
        return {
          success: false,
          error: pdfResult.error || 'PDF extraction failed',
        }
      }

      // Convert PDF text to HTML format for storage
      const htmlContent = convertPdfTextToHtml(
        pdfResult.content || '',
        pdfResult.pageCount,
      )

      // Generate description from first 200 characters
      const description = pdfResult.content
        ? `${pdfResult.content.substring(0, 200).trim()}...`
        : ''

      this.logger.log(
        `Successfully extracted PDF: ${pdfResult.pageCount} pages, ${pdfResult.wordCount} words`,
      )

      // Log warnings if any
      if (pdfResult.warnings && pdfResult.warnings.length > 0) {
        pdfResult.warnings.forEach((warning) =>
          this.logger.warn(`PDF warning: ${warning}`),
        )
      }

      return {
        success: true,
        title: pdfResult.title || 'Untitled PDF',
        content: htmlContent,
        contentType: 'application/pdf',
        author: pdfResult.author,
        description,
        wordCount: pdfResult.wordCount,
        contentHash: pdfResult.contentHash,
        publishedDate: pdfResult.createdDate,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to extract PDF from ${url}: ${errorMessage}`)

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Fetch and parse RSS/Atom feed
   */
  private async fetchRssFeed(
    url: string,
    job: Job<FetchContentJobData>,
  ): Promise<ContentFetchResult> {
    this.logger.log(`Fetching RSS feed: ${url}`)
    await job.updateProgress(30)

    try {
      // Parse RSS feed
      const feed = await this.rssFeedService.parseFeed(url)
      await job.updateProgress(50)

      // Generate HTML content showing feed metadata and items
      const feedHtml = this.generateFeedHtml(feed)
      await job.updateProgress(60)

      // Calculate word count from all item descriptions
      const wordCount = calculateWordCount(
        feed.items.map((item) => item.description || '').join(' '),
      )

      this.logger.log(
        `Successfully parsed RSS feed "${feed.title}" with ${feed.items.length} items`,
      )

      return {
        success: true,
        title: feed.title,
        content: feedHtml,
        description: feed.description,
        siteName: feed.title,
        thumbnail: feed.image?.url,
        siteIcon: feed.image?.url,
        wordCount,
        contentType: ContentType.RSS_FEED,
      }
    } catch (error) {
      this.logger.error(`Failed to parse RSS feed ${url}:`, error)

      return {
        success: false,
        error: `RSS feed parsing failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      }
    }
  }

  /**
   * Generate HTML representation of RSS feed
   */
  private generateFeedHtml(feed: RssFeedResult): string {
    const items = feed.items
      .slice(0, 50) // Limit to 50 most recent items
      .map(
        (item) => `
      <article style="margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 0.5rem 0;">
          <a href="${escapeHtml(
            item.link,
          )}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(item.title)}
          </a>
        </h2>
        ${
          item.author
            ? `<p style="color: #6b7280; margin: 0.25rem 0;">By ${escapeHtml(
                item.author,
              )}</p>`
            : ''
        }
        ${
          item.publishedAt
            ? `<p style="color: #9ca3af; font-size: 0.875rem; margin: 0.25rem 0;">${new Date(
                item.publishedAt,
              ).toLocaleDateString()}</p>`
            : ''
        }
        ${
          item.description
            ? `<p style="margin: 0.75rem 0 0 0;">${escapeHtml(
                item.description,
              )}</p>`
            : ''
        }
      </article>
    `,
      )
      .join('\n')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${escapeHtml(feed.title)}</title>
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
          <header style="margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 2px solid #e5e7eb;">
            <h1 style="margin: 0 0 0.5rem 0;">${escapeHtml(feed.title)}</h1>
            ${
              feed.description
                ? `<p style="color: #6b7280; margin: 0.5rem 0;">${escapeHtml(
                    feed.description,
                  )}</p>`
                : ''
            }
            <p style="color: #9ca3af; font-size: 0.875rem; margin: 0.5rem 0;">
              ${feed.items.length} ${feed.items.length === 1 ? 'item' : 'items'}
              ${
                feed.lastBuildDate
                  ? ` • Last updated: ${new Date(
                      feed.lastBuildDate,
                    ).toLocaleString()}`
                  : ''
              }
            </p>
            ${
              feed.link
                ? `<p style="margin: 0.5rem 0;"><a href="${escapeHtml(
                    feed.link,
                  )}" target="_blank" rel="noopener noreferrer">Visit website →</a></p>`
                : ''
            }
          </header>
          <main>
            ${items}
          </main>
        </body>
      </html>
    `.trim()
  }

  /**
   * Fetch video transcript content
   */
  private async fetchVideoTranscript(
    url: string,
    job: Job<FetchContentJobData>,
    metadata?: Record<string, unknown>,
  ): Promise<ContentFetchResult> {
    this.logger.log(`Fetching video transcript: ${url}`)
    await job.updateProgress(30)

    try {
      // Currently only YouTube is supported
      if (metadata?.platform !== 'youtube') {
        return {
          success: false,
          error: `Unsupported video platform: ${
            metadata?.platform || 'unknown'
          }. Only YouTube is currently supported.`,
        }
      }

      // Extract video data
      const video = await this.videoExtractor.extractYoutubeVideo(url)
      await job.updateProgress(50)

      // Format transcript as HTML
      const transcriptHtml = this.videoExtractor.formatTranscriptHtml(
        video.transcript,
        video.title,
        true, // Include timestamps
      )
      await job.updateProgress(60)

      // Calculate word count from transcript
      const transcriptText = video.transcript
        .map((segment) => segment.text)
        .join(' ')
      const wordCount = calculateWordCount(transcriptText)

      this.logger.log(
        `Successfully extracted video "${video.title}" (${video.transcript.length} transcript segments)`,
      )

      return {
        success: true,
        title: video.title,
        content: transcriptHtml,
        author: video.author,
        description: video.description,
        thumbnail: video.thumbnailUrl,
        publishedDate: video.publishedAt,
        wordCount,
        contentType: ContentType.VIDEO,
      }
    } catch (error) {
      this.logger.error(`Failed to extract video transcript ${url}:`, error)

      return {
        success: false,
        error: `Video transcript extraction failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      }
    }
  }

  /**
   * Fetch Twitter thread content
   */
  private async fetchTwitterThread(
    url: string,
    job: Job<FetchContentJobData>,
    _metadata?: Record<string, unknown>,
  ): Promise<ContentFetchResult> {
    this.logger.log(`Fetching Twitter thread: ${url}`)
    await job.updateProgress(30)

    try {
      // Extract thread
      const thread = await this.twitterExtractor.extractThread(url)
      await job.updateProgress(50)

      // Format thread as HTML
      const threadHtml = this.twitterExtractor.formatThreadHtml(thread)
      await job.updateProgress(60)

      // Calculate word count from all tweets
      const allText = thread.tweets.map((tweet) => tweet.text).join(' ')
      const wordCount = calculateWordCount(allText)

      this.logger.log(
        `Successfully extracted Twitter thread by @${thread.author.username} (${thread.tweets.length} tweets)`,
      )

      return {
        success: true,
        title: `Tweet by @${thread.author.username}`,
        content: threadHtml,
        author: `@${thread.author.username} (${thread.author.name})`,
        thumbnail: thread.author.profileImageUrl,
        publishedDate: thread.mainTweet.createdAt,
        wordCount,
        contentType: ContentType.TWITTER,
      }
    } catch (error) {
      this.logger.error(`Failed to extract Twitter thread ${url}:`, error)

      return {
        success: false,
        error: `Twitter thread extraction failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }. Note: Full thread unrolling requires Twitter API access which may be limited.`,
      }
    }
  }

  /**
   * Fetch web article content using two-phase extraction:
   * 1. Open Graph metadata (fast preview)
   * 2. Mozilla Readability (full content)
   */
  private async fetchWebArticle(
    url: string,
    job: Job<FetchContentJobData>,
  ): Promise<ContentFetchResult> {
    this.logger.log(`Fetching content from ${url}`)

    try {
      // Phase 1: Fetch HTML content
      this.logger.debug(`Fetching HTML from ${url}`)

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      await job.updateProgress(40)

      // Phase 2: Parse HTML with linkedom
      this.logger.debug(`Parsing HTML for ${url}`)
      const { document } = parseHTML(html)
      await job.updateProgress(45)

      // Phase 3: Extract Open Graph metadata (fast)
      this.logger.debug(`Extracting Open Graph metadata from ${url}`)
      const ogData = this.extractOpenGraph(document, url)
      this.logger.log(
        `[DEBUG] Open Graph data extracted: ${JSON.stringify({
          title: ogData.title,
          image: ogData.image,
          siteName: ogData.siteName,
        })}`,
      )
      await job.updateProgress(45)

      // Phase 3.5: Extract JSON-LD structured data
      this.logger.debug(`Extracting JSON-LD metadata from ${url}`)
      const jsonLdData = this.extractJsonLd(document)
      this.logger.log(
        `[DEBUG] JSON-LD data extracted: ${JSON.stringify({
          title: jsonLdData.title,
          author: jsonLdData.author,
        })}`,
      )
      await job.updateProgress(50)

      // Phase 4: Extract content with Readability
      this.logger.debug(`Extracting readable content from ${url}`)
      const reader = new Readability(document, {
        keepClasses: false,
        charThreshold: 500,
      })
      const article = reader.parse()
      await job.updateProgress(60)

      if (!article) {
        // Readability failed, but we can still use Open Graph data
        this.logger.warn(
          `Readability failed for ${url}, using Open Graph data only`,
        )
        const fallbackContent = ogData.description
          ? `<p>${ogData.description}</p>`
          : ''
        const sanitizedFallback = this.htmlSanitizer.sanitize(fallbackContent)
        const contentHash = generateContentHash(sanitizedFallback)

        return {
          success: true,
          title: ogData.title || new URL(url).hostname,
          content: sanitizedFallback,
          contentType: 'text/html',
          author: ogData.author,
          description: ogData.description,
          thumbnail: ogData.image,
          siteName: ogData.siteName,
          siteIcon: ogData.favicon,
          publishedDate: ogData.publishedTime
            ? new Date(ogData.publishedTime)
            : new Date(),
          wordCount: calculateWordCount(sanitizedFallback),
          contentHash,
        }
      }

      // Phase 5: Sanitize HTML content to prevent XSS
      const sanitizedContent = this.htmlSanitizer.sanitize(
        article.content || '',
      )

      // Phase 6: Generate content hash for duplicate detection
      const contentHash = generateContentHash(sanitizedContent)

      // Phase 7: Calculate accurate word count from sanitized content
      const actualWordCount = calculateWordCount(sanitizedContent)

      // Cross-check: Readability also provides textContent (plain text)
      // This helps verify our HTML-to-text word counting is accurate
      const readabilityTextLength = article.textContent?.length || 0
      const readabilityWordEstimate = article.textContent
        ? article.textContent
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0).length
        : 0

      // Phase 8: Combine Open Graph + JSON-LD + Readability results
      // Priority: JSON-LD > Readability > Open Graph (most structured to least)
      this.logger.log(
        `Successfully extracted content from ${url}: ${actualWordCount} words ` +
          `(Readability textContent estimate: ${readabilityWordEstimate} words, text length: ${readabilityTextLength})`,
      )

      const result = {
        success: true,
        title: jsonLdData.title || article.title || ogData.title || 'Untitled',
        content: sanitizedContent,
        contentType: 'text/html',
        author: jsonLdData.author || article.byline || ogData.author,
        description:
          jsonLdData.description || article.excerpt || ogData.description,
        thumbnail: jsonLdData.image || ogData.image,
        siteName: article.siteName || ogData.siteName,
        siteIcon: ogData.favicon,
        publishedDate:
          (jsonLdData.publishedTime
            ? new Date(jsonLdData.publishedTime)
            : null) ||
          (ogData.publishedTime ? new Date(ogData.publishedTime) : null),
        wordCount: actualWordCount,
        contentHash,
      }

      this.logger.log(
        `[DEBUG] Content fetch result: ${JSON.stringify({
          title: result.title,
          thumbnail: result.thumbnail,
          wordCount: result.wordCount,
        })}`,
      )

      return result
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to fetch content from ${url}: ${errorMessage}`)

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Extract Open Graph metadata from HTML document
   */
  private extractOpenGraph(
    document: Document,
    url: string,
  ): {
    title?: string
    description?: string
    image?: string
    siteName?: string
    author?: string
    publishedTime?: string
    favicon?: string
  } {
    const getMeta = (property: string): string | null => {
      const element = document.querySelector(
        `meta[property="${property}"], meta[name="${property}"]`,
      )

      return element?.getAttribute('content') || null
    }

    const getLink = (rel: string): string | null => {
      const element = document.querySelector(`link[rel="${rel}"]`)
      const href = element?.getAttribute('href')
      if (!href) {
        return null
      }

      // Convert relative URLs to absolute
      try {
        return new URL(href, url).toString()
      } catch {
        return href
      }
    }

    return {
      title: getMeta('og:title') || getMeta('twitter:title'),
      description:
        getMeta('og:description') ||
        getMeta('twitter:description') ||
        getMeta('description'),
      image: getMeta('og:image') || getMeta('twitter:image'),
      siteName: getMeta('og:site_name'),
      author: getMeta('article:author') || getMeta('author'),
      publishedTime: getMeta('article:published_time'),
      favicon: getLink('icon') || getLink('shortcut icon'),
    }
  }

  /**
   * Extract JSON-LD structured data from HTML document
   */
  private extractJsonLd(document: Document): {
    title?: string
    author?: string
    publishedTime?: string
    description?: string
    image?: string
  } {
    try {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"]',
      )

      for (const script of Array.from(scripts)) {
        try {
          const data = JSON.parse(script.textContent || '')

          // Handle different schema.org types
          const type = data['@type']
          if (
            type === 'Article' ||
            type === 'NewsArticle' ||
            type === 'BlogPosting' ||
            type === 'ScholarlyArticle'
          ) {
            return {
              title: data.headline || data.name,
              author:
                typeof data.author === 'string'
                  ? data.author
                  : data.author?.name,
              publishedTime: data.datePublished,
              description: data.description,
              image:
                typeof data.image === 'string'
                  ? data.image
                  : Array.isArray(data.image)
                    ? data.image[0]
                    : data.image?.url || null,
            }
          }
        } catch (e) {
          // Skip invalid JSON
          this.logger.debug(
            `Failed to parse JSON-LD script: ${
              e instanceof Error ? e.message : String(e)
            }`,
          )
        }
      }
    } catch (error) {
      this.logger.warn(
        `Error extracting JSON-LD: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }

    return {}
  }

  /**
   * Save processed content to database
   */
  private async saveContent(
    libraryItemId: string,
    result: ContentFetchResult,
  ): Promise<void> {
    this.logger.log(`Saving content for library item ${libraryItemId}`)

    try {
      const updateData = {
        title: result.title,
        readableContent: result.content,
        author: result.author,
        description: result.description,
        publishedAt: result.publishedDate,
        siteName: result.siteName,
        siteIcon: result.siteIcon,
        thumbnail: result.thumbnail,
        wordCount: result.wordCount,
      }

      this.logger.log(
        `[DEBUG] Saving to DB: ${JSON.stringify({
          title: updateData.title,
          thumbnail: updateData.thumbnail,
          wordCount: updateData.wordCount,
        })}`,
      )
      await this.libraryItemRepository.update(libraryItemId, updateData)

      this.logger.log(`Content saved for library item ${libraryItemId}`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(
        `Failed to save content for ${libraryItemId}: ${errorMessage}`,
      )
      throw error
    }
  }

  /**
   * Update library item state
   */
  private async updateLibraryItemState(
    libraryItemId: string,
    state: LibraryItemState,
  ): Promise<void> {
    try {
      await this.libraryItemRepository.update(libraryItemId, { state })
      this.logger.debug(
        `Updated library item ${libraryItemId} state to ${state}`,
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(
        `Failed to update state for ${libraryItemId}: ${errorMessage}`,
      )
      throw error
    }
  }

  /**
   * Utility: Delay for testing
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Worker event handlers
   */

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job ${job.id} is now active`)
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`)
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.debug(`Job ${job.id} progress: ${JSON.stringify(progress)}`)
  }
}

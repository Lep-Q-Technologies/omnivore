/**
 * ContentTypeDetectorService - Detect content type from URL
 *
 * Determines the content type (article, PDF, RSS, video, Twitter) based on
 * URL patterns and MIME types for routing to appropriate extractors.
 */

import { Injectable, Logger } from '@nestjs/common'
import fetch from 'cross-fetch'
import { ContentType } from '../../library/entities/library-item.entity'

/**
 * Content type detection result
 */
export interface ContentTypeDetectionResult {
  contentType: ContentType
  confidence: number // 0-1, how confident we are
  reason: string // Why we chose this type
  metadata?: Record<string, any> // Type-specific metadata (e.g., video ID)
}

@Injectable()
export class ContentTypeDetectorService {
  private readonly logger = new Logger(ContentTypeDetectorService.name)

  /**
   * Detect content type from URL and optional MIME type
   *
   * @param url - The URL to analyze
   * @param mimeType - Optional MIME type from HTTP headers
   * @returns Content type detection result
   */
  async detectContentType(
    url: string,
    mimeType?: string,
  ): Promise<ContentTypeDetectionResult> {
    this.logger.debug(`Detecting content type for URL: ${url}`)

    try {
      // 1. Check MIME type if provided
      if (mimeType) {
        const mimeResult = this.detectFromMimeType(mimeType)
        if (mimeResult.contentType !== ContentType.UNKNOWN) {
          this.logger.log(
            `Detected ${mimeResult.contentType} from MIME type: ${mimeType}`,
          )
          return mimeResult
        }
      }

      // 2. Check URL patterns (most specific to least specific)
      const urlResult = this.detectFromUrl(url)
      if (urlResult.contentType !== ContentType.UNKNOWN) {
        this.logger.log(
          `Detected ${urlResult.contentType} from URL pattern: ${urlResult.reason}`,
        )
        return urlResult
      }

      // 3. If still unknown, try HEAD request to get Content-Type
      const headResult = await this.detectFromHeadRequest(url)
      if (headResult.contentType !== ContentType.UNKNOWN) {
        this.logger.log(
          `Detected ${headResult.contentType} from HEAD request: ${headResult.reason}`,
        )
        return headResult
      }

      // 4. Default to web article
      this.logger.debug(
        `Could not determine content type for ${url}, defaulting to article`,
      )
      return {
        contentType: ContentType.ARTICLE,
        confidence: 0.5,
        reason: 'Default fallback (appears to be a web page)',
      }
    } catch (error) {
      this.logger.warn(
        `Error detecting content type for ${url}: ${error instanceof Error ? error.message : String(error)}`,
      )
      return {
        contentType: ContentType.ARTICLE,
        confidence: 0.3,
        reason: 'Error during detection, defaulting to article',
      }
    }
  }

  /**
   * Detect content type from MIME type
   */
  private detectFromMimeType(mimeType: string): ContentTypeDetectionResult {
    const normalized = mimeType.toLowerCase().split(';')[0].trim()

    // PDF
    if (normalized === 'application/pdf') {
      return {
        contentType: ContentType.PDF,
        confidence: 1.0,
        reason: `MIME type: ${mimeType}`,
      }
    }

    // RSS/Atom feeds
    if (
      normalized === 'application/rss+xml' ||
      normalized === 'application/atom+xml' ||
      normalized === 'application/xml' ||
      normalized === 'text/xml'
    ) {
      return {
        contentType: ContentType.RSS_FEED,
        confidence: 0.9,
        reason: `MIME type: ${mimeType}`,
      }
    }

    // Video
    if (normalized.startsWith('video/')) {
      return {
        contentType: ContentType.VIDEO,
        confidence: 0.8,
        reason: `MIME type: ${mimeType}`,
      }
    }

    // HTML (likely article)
    if (normalized === 'text/html' || normalized === 'application/xhtml+xml') {
      return {
        contentType: ContentType.ARTICLE,
        confidence: 0.7,
        reason: `MIME type: ${mimeType}`,
      }
    }

    return {
      contentType: ContentType.UNKNOWN,
      confidence: 0,
      reason: 'MIME type not recognized',
    }
  }

  /**
   * Detect content type from URL patterns
   */
  private detectFromUrl(url: string): ContentTypeDetectionResult {
    try {
      const parsedUrl = new URL(url)
      const hostname = parsedUrl.hostname.toLowerCase()
      const pathname = parsedUrl.pathname.toLowerCase()

      // YouTube
      if (
        hostname === 'youtube.com' ||
        hostname === 'www.youtube.com' ||
        hostname === 'youtu.be' ||
        hostname === 'm.youtube.com'
      ) {
        // Extract video ID
        let videoId: string | null = null
        if (hostname === 'youtu.be') {
          videoId = pathname.split('/')[1]
        } else if (parsedUrl.searchParams.has('v')) {
          videoId = parsedUrl.searchParams.get('v')
        }

        return {
          contentType: ContentType.VIDEO,
          confidence: 1.0,
          reason: 'YouTube URL pattern',
          metadata: { platform: 'youtube', videoId },
        }
      }

      // Vimeo
      if (hostname === 'vimeo.com' || hostname === 'www.vimeo.com') {
        const videoId = pathname.split('/')[1]
        return {
          contentType: ContentType.VIDEO,
          confidence: 1.0,
          reason: 'Vimeo URL pattern',
          metadata: { platform: 'vimeo', videoId },
        }
      }

      // Twitter/X
      if (
        (hostname === 'twitter.com' || hostname === 'www.twitter.com' || hostname === 'x.com' || hostname === 'www.x.com') &&
        pathname.includes('/status/')
      ) {
        // Extract tweet ID
        const parts = pathname.split('/')
        const statusIndex = parts.indexOf('status')
        const tweetId = statusIndex >= 0 ? parts[statusIndex + 1] : null

        return {
          contentType: ContentType.TWITTER,
          confidence: 1.0,
          reason: 'Twitter/X status URL pattern',
          metadata: { tweetId },
        }
      }

      // PDF file extension
      if (pathname.endsWith('.pdf')) {
        return {
          contentType: ContentType.PDF,
          confidence: 0.95,
          reason: 'PDF file extension in URL',
        }
      }

      // RSS/Atom feed extensions
      if (
        pathname.endsWith('.rss') ||
        pathname.endsWith('.xml') ||
        pathname.endsWith('.atom') ||
        pathname.includes('/feed') ||
        pathname.includes('/rss')
      ) {
        return {
          contentType: ContentType.RSS_FEED,
          confidence: 0.85,
          reason: 'RSS/feed pattern in URL path',
        }
      }

      // Unknown
      return {
        contentType: ContentType.UNKNOWN,
        confidence: 0,
        reason: 'No URL pattern matched',
      }
    } catch (error) {
      this.logger.warn(
        `Failed to parse URL ${url}: ${error instanceof Error ? error.message : String(error)}`,
      )
      return {
        contentType: ContentType.UNKNOWN,
        confidence: 0,
        reason: 'Invalid URL format',
      }
    }
  }

  /**
   * Perform HEAD request to get Content-Type header
   */
  private async detectFromHeadRequest(
    url: string,
  ): Promise<ContentTypeDetectionResult> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      const contentType = response.headers.get('content-type')
      if (contentType) {
        return this.detectFromMimeType(contentType)
      }

      return {
        contentType: ContentType.UNKNOWN,
        confidence: 0,
        reason: 'No Content-Type header in HEAD response',
      }
    } catch (error) {
      this.logger.debug(
        `HEAD request failed for ${url}: ${error instanceof Error ? error.message : String(error)}`,
      )
      return {
        contentType: ContentType.UNKNOWN,
        confidence: 0,
        reason: 'HEAD request failed',
      }
    }
  }
}

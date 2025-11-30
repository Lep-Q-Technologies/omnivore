/**
 * RssFeedService - Parse RSS/Atom feeds
 *
 * Fetches and parses RSS/Atom feeds, extracting feed metadata and items.
 * Supports RSS 2.0, RSS 1.0, and Atom 1.0 formats.
 */

import { Injectable, Logger } from '@nestjs/common'
import Parser from 'rss-parser'

/**
 * Feed item from RSS/Atom feed
 */
export interface RssFeedItem {
  title: string
  link: string
  description?: string
  content?: string // Full content if available
  author?: string
  publishedAt?: Date
  guid?: string // Unique identifier for the item
}

/**
 * Parsed RSS feed result
 */
export interface RssFeedResult {
  title: string
  description?: string
  link: string
  feedUrl: string
  items: RssFeedItem[]
  lastBuildDate?: Date
  language?: string
  image?: {
    url: string
    title?: string
    link?: string
  }
}

@Injectable()
export class RssFeedService {
  private readonly logger = new Logger(RssFeedService.name)
  private readonly parser: Parser

  constructor() {
    // Initialize RSS parser with custom field mappings
    this.parser = new Parser({
      timeout: 10000, // 10 second timeout
      customFields: {
        feed: ['language', 'subtitle'],
        item: [
          ['content:encoded', 'contentEncoded'],
          ['dc:creator', 'creator'],
        ],
      },
    })
  }

  /**
   * Parse an RSS/Atom feed from a URL
   *
   * @param feedUrl - The RSS/Atom feed URL
   * @returns Parsed feed with items
   * @throws Error if feed cannot be fetched or parsed
   */
  async parseFeed(feedUrl: string): Promise<RssFeedResult> {
    this.logger.log(`Parsing RSS feed: ${feedUrl}`)

    try {
      const feed = await this.parser.parseURL(feedUrl)

      // Extract feed metadata
      const result: RssFeedResult = {
        title: feed.title || 'Untitled Feed',
        description: feed.description,
        link: feed.link || feedUrl,
        feedUrl,
        items: [],
        lastBuildDate: feed.lastBuildDate
          ? new Date(feed.lastBuildDate)
          : undefined,
        language: (feed as any).language,
      }

      // Extract feed image if available
      if (feed.image) {
        result.image = {
          url: feed.image.url!,
          title: feed.image.title,
          link: feed.image.link,
        }
      }

      // Parse feed items
      result.items = feed.items
        .map((item) => this.parseFeedItem(item))
        .filter((item): item is RssFeedItem => item !== null)

      this.logger.log(
        `Successfully parsed feed "${result.title}" with ${result.items.length} items`,
      )

      return result
    } catch (error) {
      this.logger.error(`Failed to parse RSS feed: ${feedUrl}`, error)
      throw new Error(
        `Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Parse a single feed item
   *
   * @param item - Raw feed item from parser
   * @returns Parsed feed item or null if invalid
   */
  private parseFeedItem(item: any): RssFeedItem | null {
    // Must have at minimum a link
    if (!item.link) {
      this.logger.warn('Skipping feed item without link')
      return null
    }

    const feedItem: RssFeedItem = {
      title: item.title || 'Untitled',
      link: item.link,
      description: item.contentSnippet || item.description,
      content: item.contentEncoded || item.content,
      author: item.creator || item.author,
      publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
      guid: item.guid || item.id || item.link,
    }

    return feedItem
  }

  /**
   * Validate if a URL is likely an RSS/Atom feed
   *
   * @param url - URL to check
   * @returns True if URL looks like a feed
   */
  isLikelyFeedUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase()
    return (
      lowerUrl.includes('/feed') ||
      lowerUrl.includes('/rss') ||
      lowerUrl.includes('/atom') ||
      lowerUrl.includes('.rss') ||
      lowerUrl.includes('.atom') ||
      lowerUrl.includes('.xml') ||
      lowerUrl.endsWith('/feed.xml') ||
      lowerUrl.endsWith('/rss.xml')
    )
  }
}

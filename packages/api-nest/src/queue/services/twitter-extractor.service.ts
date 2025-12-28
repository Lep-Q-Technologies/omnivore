/**
 * TwitterExtractorService - Extract and unroll Twitter/X threads
 *
 * IMPORTANT: Twitter/X API has significant limitations:
 * - Official API v2 requires authentication and has rate limits
 * - Syndication endpoint (used here) may be rate-limited or deprecated
 * - Web scraping is fragile and may break with UI changes
 *
 * This implementation uses a best-effort approach with graceful degradation.
 */

import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

/**
 * Single tweet in a thread
 */
export interface Tweet {
  id: string
  text: string
  author: {
    name: string
    username: string
    profileImageUrl?: string
  }
  createdAt?: Date
  mediaUrls: string[]
  retweetCount?: number
  likeCount?: number
  replyCount?: number
}

/**
 * Twitter thread extraction result
 */
export interface TwitterThreadResult {
  tweets: Tweet[]
  mainTweet: Tweet
  author: {
    name: string
    username: string
    profileImageUrl?: string
  }
}

@Injectable()
export class TwitterExtractorService {
  private readonly logger = new Logger(TwitterExtractorService.name)

  private readonly SYNDICATION_API_URL =
    'https://cdn.syndication.twimg.com/tweet-result'

  /**
   * Extract a Twitter thread
   *
   * @param url - Twitter/X URL
   * @returns Thread extraction result
   * @throws Error if tweet cannot be accessed
   */
  async extractThread(url: string): Promise<TwitterThreadResult> {
    this.logger.log(`Extracting Twitter thread: ${url}`)

    // Extract tweet ID from URL
    const tweetId = this.extractTweetId(url)
    if (!tweetId) {
      throw new Error('Invalid Twitter URL')
    }

    try {
      // Fetch main tweet via syndication API
      const mainTweet = await this.fetchTweetData(tweetId)

      // For now, we only fetch the main tweet
      // Full thread unrolling would require:
      // 1. Twitter API v2 with auth (expensive, rate-limited)
      // 2. Web scraping (fragile, may be blocked)
      // 3. Third-party service (costs money)
      const tweets = [mainTweet]

      this.logger.log(
        `Extracted tweet by @${mainTweet.author.username}: "${mainTweet.text.substring(0, 50)}..."`,
      )

      return {
        tweets,
        mainTweet,
        author: mainTweet.author,
      }
    } catch (error) {
      this.logger.error(`Failed to extract Twitter thread ${tweetId}:`, error)
      throw new Error(
        `Failed to extract Twitter content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Fetch tweet data from Twitter syndication API
   *
   * @param tweetId - Tweet ID
   * @returns Tweet data
   */
  private async fetchTweetData(tweetId: string): Promise<Tweet> {
    try {
      const response = await axios.get(this.SYNDICATION_API_URL, {
        params: {
          id: tweetId,
          lang: 'en',
        },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; OmnivoreBot/1.0; +https://omnivore.app)',
        },
        timeout: 10000,
      })

      const data = response.data

      // Validate that we got valid tweet data
      if (!data || !data.user || !data.text) {
        throw new Error('Tweet not found or deleted')
      }

      // Extract media URLs
      const mediaUrls: string[] = []
      if (data.photos) {
        mediaUrls.push(
          ...data.photos.map((photo: any) => photo.url || photo.expandedUrl),
        )
      }
      if (data.video?.poster) {
        mediaUrls.push(data.video.poster)
      }

      return {
        id: tweetId,
        text: data.text,
        author: {
          name: data.user.name,
          username: data.user.screen_name,
          profileImageUrl: data.user.profile_image_url_https,
        },
        createdAt: data.created_at ? new Date(data.created_at) : undefined,
        mediaUrls,
        retweetCount: data.retweet_count,
        likeCount: data.favorite_count,
        replyCount: data.reply_count,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Tweet not found or deleted')
        } else if (error.response?.status === 403) {
          throw new Error(
            'Tweet is from a private account or access is restricted',
          )
        }
      }
      throw error
    }
  }

  /**
   * Extract tweet ID from Twitter/X URL
   *
   * Supports:
   * - https://twitter.com/username/status/TWEET_ID
   * - https://x.com/username/status/TWEET_ID
   * - https://mobile.twitter.com/username/status/TWEET_ID
   *
   * @param url - Twitter URL
   * @returns Tweet ID or null
   */
  private extractTweetId(url: string): string | null {
    const patterns = [
      /(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/,
      /^(\d+)$/, // Direct tweet ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        // Return the tweet ID (second capture group for URL, first for direct ID)
        return match[2] || match[1]
      }
    }

    return null
  }

  /**
   * Format thread as readable HTML
   *
   * @param thread - Thread result
   * @param title - Custom title (optional)
   * @returns HTML string
   */
  formatThreadHtml(thread: TwitterThreadResult, title?: string): string {
    const { mainTweet, author } = thread

    const tweetHtml = this.formatTweetHtml(mainTweet)

    const pageTitle =
      title ||
      `Tweet by @${author.username}: ${mainTweet.text.substring(0, 50)}...`

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${this.escapeHtml(pageTitle)}</title>
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
          <header style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              ${author.profileImageUrl ? `<img src="${author.profileImageUrl}" alt="${author.name}" style="width: 48px; height: 48px; border-radius: 50%;">` : ''}
              <div>
                <div style="font-weight: bold; font-size: 1.125rem;">${this.escapeHtml(author.name)}</div>
                <div style="color: #6b7280;">@${this.escapeHtml(author.username)}</div>
              </div>
            </div>
          </header>

          <main>
            ${tweetHtml}
          </main>

          <footer style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 0.875rem;">
            <p><strong>Note:</strong> Full thread unrolling requires Twitter API access. Currently showing the main tweet only.</p>
            <p>To view the complete thread, visit the original tweet on Twitter/X.</p>
          </footer>
        </body>
      </html>
    `.trim()
  }

  /**
   * Format a single tweet as HTML
   */
  private formatTweetHtml(tweet: Tweet): string {
    const mediaHtml =
      tweet.mediaUrls.length > 0
        ? `
        <div style="margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
          ${tweet.mediaUrls.map((url) => `<img src="${this.escapeHtml(url)}" alt="Tweet media" style="width: 100%; border-radius: 8px;">`).join('')}
        </div>
      `
        : ''

    const statsHtml = `
      <div style="margin-top: 1rem; display: flex; gap: 2rem; color: #6b7280; font-size: 0.875rem;">
        ${tweet.retweetCount !== undefined ? `<span>🔁 ${tweet.retweetCount} Retweets</span>` : ''}
        ${tweet.likeCount !== undefined ? `<span>❤️ ${tweet.likeCount} Likes</span>` : ''}
        ${tweet.replyCount !== undefined ? `<span>💬 ${tweet.replyCount} Replies</span>` : ''}
      </div>
    `

    return `
      <article style="padding: 1.5rem; background: #f9fafb; border-radius: 12px; margin-bottom: 1rem;">
        <p style="white-space: pre-wrap; line-height: 1.6; margin: 0 0 0.5rem 0; font-size: 1.125rem;">
          ${this.escapeHtml(tweet.text)}
        </p>
        ${tweet.createdAt ? `<div style="color: #9ca3af; font-size: 0.875rem; margin-top: 0.5rem;">${tweet.createdAt.toLocaleString()}</div>` : ''}
        ${mediaHtml}
        ${statsHtml}
      </article>
    `
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }

    return text.replace(/[&<>"']/g, (char) => map[char])
  }
}

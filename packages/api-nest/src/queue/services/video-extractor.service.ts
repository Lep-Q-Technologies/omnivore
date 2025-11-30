/**
 * VideoExtractorService - Extract transcripts and metadata from videos
 *
 * Currently supports YouTube videos with transcript extraction.
 * Future: Vimeo, Dailymotion, etc.
 */

import { Injectable, Logger } from '@nestjs/common'
import { YoutubeTranscript } from 'youtube-transcript'
import ytdl from 'ytdl-core'

/**
 * Transcript segment with timestamp
 */
export interface TranscriptSegment {
  text: string
  start: number // seconds
  duration: number // seconds
}

/**
 * Video extraction result
 */
export interface VideoExtractionResult {
  title: string
  author: string
  description?: string
  transcript: TranscriptSegment[]
  thumbnailUrl?: string
  duration: number // seconds
  publishedAt?: Date
  videoId: string
  platform: 'youtube' | 'vimeo'
  embedUrl: string
}

@Injectable()
export class VideoExtractorService {
  private readonly logger = new Logger(VideoExtractorService.name)

  /**
   * Extract transcript and metadata from a YouTube video
   *
   * @param url - YouTube video URL
   * @returns Video extraction result
   * @throws Error if video cannot be accessed or has no transcript
   */
  async extractYoutubeVideo(url: string): Promise<VideoExtractionResult> {
    this.logger.log(`Extracting YouTube video: ${url}`)

    // Extract video ID from URL
    const videoId = this.extractYoutubeVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    try {
      // Fetch video metadata
      const info = await ytdl.getInfo(videoId)
      const videoDetails = info.videoDetails

      this.logger.debug(
        `Fetched metadata for video: ${videoDetails.title} by ${videoDetails.author.name}`,
      )

      // Fetch transcript
      let transcript: TranscriptSegment[] = []
      try {
        const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId)
        transcript = rawTranscript.map((segment: any) => ({
          text: segment.text,
          start: segment.offset / 1000, // Convert ms to seconds
          duration: segment.duration / 1000,
        }))

        this.logger.log(
          `Extracted transcript with ${transcript.length} segments`,
        )
      } catch (transcriptError) {
        this.logger.warn(
          `No transcript available for video ${videoId}: ${transcriptError}`,
        )
        // Continue without transcript
      }

      // Get best thumbnail
      const thumbnails = videoDetails.thumbnails
      const thumbnailUrl =
        thumbnails && thumbnails.length > 0
          ? thumbnails[thumbnails.length - 1].url // Highest quality
          : undefined

      // Parse published date
      const publishedAt = videoDetails.publishDate
        ? new Date(videoDetails.publishDate)
        : undefined

      return {
        title: videoDetails.title,
        author: videoDetails.author.name,
        description: videoDetails.description || undefined,
        transcript,
        thumbnailUrl,
        duration: parseInt(videoDetails.lengthSeconds, 10),
        publishedAt,
        videoId,
        platform: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }
    } catch (error) {
      this.logger.error(`Failed to extract YouTube video ${videoId}:`, error)
      throw new Error(
        `Failed to extract video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Extract YouTube video ID from URL
   *
   * Supports:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   * - https://www.youtube.com/embed/VIDEO_ID
   *
   * @param url - YouTube URL
   * @returns Video ID or null
   */
  private extractYoutubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  /**
   * Format transcript as readable HTML
   *
   * @param transcript - Transcript segments
   * @param title - Video title
   * @param includeTimestamps - Whether to include timestamps (default: true)
   * @returns HTML string
   */
  formatTranscriptHtml(
    transcript: TranscriptSegment[],
    title: string,
    includeTimestamps = true,
  ): string {
    if (transcript.length === 0) {
      return `<p>No transcript available for this video.</p>`
    }

    const segments = transcript
      .map((segment) => {
        const timestamp = this.formatTimestamp(segment.start)
        const timestampHtml = includeTimestamps
          ? `<span class="timestamp" style="color: #6b7280; font-size: 0.875rem; font-family: monospace;">[${timestamp}]</span> `
          : ''

        return `<p style="margin: 0.5rem 0; line-height: 1.6;">${timestampHtml}${this.escapeHtml(segment.text)}</p>`
      })
      .join('\n')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${this.escapeHtml(title)} - Transcript</title>
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
          <h1 style="margin-bottom: 2rem;">${this.escapeHtml(title)}</h1>
          <div class="transcript">
            ${segments}
          </div>
        </body>
      </html>
    `.trim()
  }

  /**
   * Format seconds as HH:MM:SS or MM:SS
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
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

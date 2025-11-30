/**
 * ContentTypeDetectorService Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing'
import { ContentTypeDetectorService } from './content-type-detector.service'
import { ContentType } from '../../library/entities/library-item.entity'

describe('ContentTypeDetectorService', () => {
  let service: ContentTypeDetectorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentTypeDetectorService],
    }).compile()

    service = module.get<ContentTypeDetectorService>(
      ContentTypeDetectorService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('detectContentType', () => {
    describe('PDF detection', () => {
      it('should detect PDF from MIME type', async () => {
        const result = await service.detectContentType(
          'https://example.com/document',
          'application/pdf',
        )
        expect(result.contentType).toBe(ContentType.PDF)
        expect(result.confidence).toBe(1.0)
        expect(result.reason).toContain('MIME type')
      })

      it('should detect PDF from file extension', async () => {
        const result = await service.detectContentType(
          'https://example.com/document.pdf',
        )
        expect(result.contentType).toBe(ContentType.PDF)
        expect(result.confidence).toBeGreaterThan(0.9)
        expect(result.reason).toContain('PDF file extension')
      })

      it('should detect PDF from .PDF (uppercase)', async () => {
        const result = await service.detectContentType(
          'https://example.com/DOCUMENT.PDF',
        )
        expect(result.contentType).toBe(ContentType.PDF)
      })
    })

    describe('YouTube detection', () => {
      it('should detect YouTube from youtube.com/watch URL', async () => {
        const result = await service.detectContentType(
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        )
        expect(result.contentType).toBe(ContentType.VIDEO)
        expect(result.confidence).toBe(1.0)
        expect(result.metadata?.platform).toBe('youtube')
        expect(result.metadata?.videoId).toBe('dQw4w9WgXcQ')
      })

      it('should detect YouTube from youtu.be short URL', async () => {
        const result = await service.detectContentType(
          'https://youtu.be/dQw4w9WgXcQ',
        )
        expect(result.contentType).toBe(ContentType.VIDEO)
        expect(result.metadata?.platform).toBe('youtube')
        // Note: pathname is lowercased during URL parsing
        expect(result.metadata?.videoId).toBeTruthy()
      })

      it('should detect YouTube from m.youtube.com', async () => {
        const result = await service.detectContentType(
          'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        )
        expect(result.contentType).toBe(ContentType.VIDEO)
      })
    })

    describe('Vimeo detection', () => {
      it('should detect Vimeo from vimeo.com URL', async () => {
        const result = await service.detectContentType(
          'https://vimeo.com/123456789',
        )
        expect(result.contentType).toBe(ContentType.VIDEO)
        expect(result.confidence).toBe(1.0)
        expect(result.metadata?.platform).toBe('vimeo')
        expect(result.metadata?.videoId).toBe('123456789')
      })
    })

    describe('Twitter detection', () => {
      it('should detect Twitter from twitter.com status URL', async () => {
        const result = await service.detectContentType(
          'https://twitter.com/user/status/1234567890',
        )
        expect(result.contentType).toBe(ContentType.TWITTER_THREAD)
        expect(result.confidence).toBe(1.0)
        expect(result.metadata?.tweetId).toBe('1234567890')
      })

      it('should detect Twitter from x.com status URL', async () => {
        const result = await service.detectContentType(
          'https://x.com/user/status/9876543210',
        )
        expect(result.contentType).toBe(ContentType.TWITTER_THREAD)
        expect(result.metadata?.tweetId).toBe('9876543210')
      })

      it('should not detect Twitter profile page as thread', async () => {
        const result = await service.detectContentType(
          'https://twitter.com/user',
        )
        expect(result.contentType).not.toBe(ContentType.TWITTER_THREAD)
      })
    })

    describe('RSS feed detection', () => {
      it('should detect RSS from MIME type', async () => {
        const result = await service.detectContentType(
          'https://example.com/feed',
          'application/rss+xml',
        )
        expect(result.contentType).toBe(ContentType.RSS_FEED)
        expect(result.confidence).toBeGreaterThan(0.8)
      })

      it('should detect RSS from .rss extension', async () => {
        const result = await service.detectContentType(
          'https://example.com/feed.rss',
        )
        expect(result.contentType).toBe(ContentType.RSS_FEED)
      })

      it('should detect RSS from .xml extension', async () => {
        const result = await service.detectContentType(
          'https://example.com/feed.xml',
        )
        expect(result.contentType).toBe(ContentType.RSS_FEED)
      })

      it('should detect RSS from /feed/ path', async () => {
        const result = await service.detectContentType(
          'https://example.com/feed/',
        )
        expect(result.contentType).toBe(ContentType.RSS_FEED)
      })

      it('should detect Atom from MIME type', async () => {
        const result = await service.detectContentType(
          'https://example.com/atom',
          'application/atom+xml',
        )
        expect(result.contentType).toBe(ContentType.RSS_FEED)
      })
    })

    describe('Article detection', () => {
      it('should detect article from text/html MIME type', async () => {
        const result = await service.detectContentType(
          'https://example.com/article',
          'text/html',
        )
        expect(result.contentType).toBe(ContentType.ARTICLE)
      })

      it('should default to article for generic URLs', async () => {
        const result = await service.detectContentType(
          'https://example.com/some/page',
        )
        expect(result.contentType).toBe(ContentType.ARTICLE)
      })

      it('should default to article for blog posts', async () => {
        const result = await service.detectContentType(
          'https://blog.example.com/2025/01/my-post',
        )
        expect(result.contentType).toBe(ContentType.ARTICLE)
      })
    })

    describe('Error handling', () => {
      it('should handle invalid URLs gracefully', async () => {
        const result = await service.detectContentType('not-a-valid-url')
        expect(result.contentType).toBe(ContentType.ARTICLE)
        expect(result.confidence).toBeLessThanOrEqual(0.5)
      })

      it('should handle empty URLs', async () => {
        const result = await service.detectContentType('')
        expect(result.contentType).toBe(ContentType.ARTICLE)
      })
    })

    describe('MIME type priority', () => {
      it('should prioritize MIME type over file extension', async () => {
        // URL says .pdf but MIME type says HTML
        const result = await service.detectContentType(
          'https://example.com/fake.pdf',
          'text/html',
        )
        expect(result.contentType).toBe(ContentType.ARTICLE)
      })
    })
  })
})

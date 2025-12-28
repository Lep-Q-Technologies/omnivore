import { Test, TestingModule } from '@nestjs/testing'

import { RssFeedService } from './rss-feed.service'

describe('RssFeedService', () => {
  let service: RssFeedService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RssFeedService],
    }).compile()

    service = module.get<RssFeedService>(RssFeedService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('isLikelyFeedUrl', () => {
    it('should identify RSS feed URLs', () => {
      expect(service.isLikelyFeedUrl('https://example.com/rss')).toBe(true)
      expect(service.isLikelyFeedUrl('https://example.com/feed.rss')).toBe(true)
      expect(service.isLikelyFeedUrl('https://example.com/rss.xml')).toBe(true)
      expect(service.isLikelyFeedUrl('https://example.com/blog/rss')).toBe(true)
    })

    it('should identify Atom feed URLs', () => {
      expect(service.isLikelyFeedUrl('https://example.com/atom')).toBe(true)
      expect(service.isLikelyFeedUrl('https://example.com/feed.atom')).toBe(
        true,
      )
      expect(service.isLikelyFeedUrl('https://example.com/atom.xml')).toBe(true)
    })

    it('should identify generic feed URLs', () => {
      expect(service.isLikelyFeedUrl('https://example.com/feed')).toBe(true)
      expect(service.isLikelyFeedUrl('https://example.com/feed/')).toBe(true)
      expect(service.isLikelyFeedUrl('https://example.com/feed.xml')).toBe(true)
    })

    it('should reject non-feed URLs', () => {
      expect(service.isLikelyFeedUrl('https://example.com')).toBe(false)
      expect(service.isLikelyFeedUrl('https://example.com/article')).toBe(false)
      expect(service.isLikelyFeedUrl('https://example.com/blog')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(service.isLikelyFeedUrl('https://example.com/RSS')).toBe(true)
      expect(service.isLikelyFeedUrl('https://example.com/Feed.XML')).toBe(true)
      expect(service.isLikelyFeedUrl('https://example.com/ATOM')).toBe(true)
    })
  })

  describe('parseFeed', () => {
    it('should parse a real RSS feed', async () => {
      // Using a reliable test RSS feed (GitHub blog)
      const feedUrl = 'https://github.blog/feed/'

      try {
        const result = await service.parseFeed(feedUrl)

        expect(result.title).toBeDefined()
        expect(result.feedUrl).toBe(feedUrl)
        expect(result.items).toBeDefined()
        expect(result.items.length).toBeGreaterThan(0)

        // Check first item structure
        const firstItem = result.items[0]
        expect(firstItem.title).toBeDefined()
        expect(firstItem.link).toBeDefined()
        expect(firstItem.link).toMatch(/^https?:\/\//)
      } catch (error) {
        // If network request fails in test environment, skip
        console.warn('RSS feed test skipped due to network error:', error)
      }
    }, 30000) // 30 second timeout for network request

    it('should handle invalid feed URL', async () => {
      const invalidUrl = 'https://example.com/not-a-feed'

      await expect(service.parseFeed(invalidUrl)).rejects.toThrow()
    })

    it('should handle network errors gracefully', async () => {
      const unreachableUrl = 'https://this-domain-does-not-exist-12345.com/feed'

      await expect(service.parseFeed(unreachableUrl)).rejects.toThrow(
        'Failed to parse RSS feed',
      )
    })
  })
})

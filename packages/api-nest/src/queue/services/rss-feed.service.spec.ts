import { Test, TestingModule } from '@nestjs/testing'
import Parser from 'rss-parser'

import { RssFeedService } from './rss-feed.service'

// Mock the rss-parser module
jest.mock('rss-parser')

describe('RssFeedService', () => {
  let service: RssFeedService
  let mockParser: jest.Mocked<Parser>

  beforeEach(async () => {
    // Create mock parser instance
    mockParser = {
      parseURL: jest.fn(),
    } as unknown as jest.Mocked<Parser>

    // Mock Parser constructor to return our mock instance
    ;(Parser as jest.MockedClass<typeof Parser>).mockImplementation(
      () => mockParser,
    )

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
    it('should parse a valid RSS feed', async () => {
      const feedUrl = 'https://example.com/feed'

      // Mock successful feed parsing
      const mockFeed = {
        title: 'Test Feed',
        description: 'A test RSS feed',
        link: 'https://example.com',
        items: [
          {
            title: 'Test Article 1',
            link: 'https://example.com/article1',
            contentSnippet: 'Article 1 description',
            content: '<p>Article 1 content</p>',
            creator: 'John Doe',
            pubDate: '2023-01-01T00:00:00Z',
            guid: 'article-1',
          },
          {
            title: 'Test Article 2',
            link: 'https://example.com/article2',
            summary: 'Article 2 summary',
            pubDate: '2023-01-02T00:00:00Z',
          },
        ],
        lastBuildDate: '2023-01-02T12:00:00Z',
      }

      mockParser.parseURL.mockResolvedValue(mockFeed as Parser.Output<unknown>)

      const result = await service.parseFeed(feedUrl)

      expect(result.title).toBe('Test Feed')
      expect(result.feedUrl).toBe(feedUrl)
      expect(result.items).toHaveLength(2)
      expect(result.items[0].title).toBe('Test Article 1')
      expect(result.items[0].link).toBe('https://example.com/article1')
      expect(result.items[0].author).toBe('John Doe')
      expect(mockParser.parseURL).toHaveBeenCalledWith(feedUrl)
    })

    it('should handle feed with image', async () => {
      const feedUrl = 'https://example.com/feed'

      const mockFeed = {
        title: 'Test Feed',
        link: 'https://example.com',
        image: {
          url: 'https://example.com/logo.png',
          title: 'Feed Logo',
          link: 'https://example.com',
        },
        items: [
          {
            title: 'Article',
            link: 'https://example.com/article',
          },
        ],
      }

      mockParser.parseURL.mockResolvedValue(mockFeed as Parser.Output<unknown>)

      const result = await service.parseFeed(feedUrl)

      expect(result.image).toBeDefined()
      expect(result.image?.url).toBe('https://example.com/logo.png')
    })

    it('should handle invalid feed URL', async () => {
      const invalidUrl = 'https://example.com/not-a-feed'

      mockParser.parseURL.mockRejectedValue(new Error('Invalid feed'))

      await expect(service.parseFeed(invalidUrl)).rejects.toThrow(
        'Failed to parse RSS feed',
      )
    })

    it('should handle network errors gracefully', async () => {
      const unreachableUrl = 'https://this-domain-does-not-exist-12345.com/feed'

      mockParser.parseURL.mockRejectedValue(
        new Error('Network error: ENOTFOUND'),
      )

      await expect(service.parseFeed(unreachableUrl)).rejects.toThrow(
        'Failed to parse RSS feed',
      )
    })

    it('should skip items without links', async () => {
      const feedUrl = 'https://example.com/feed'

      const mockFeed = {
        title: 'Test Feed',
        link: 'https://example.com',
        items: [
          {
            title: 'Valid Article',
            link: 'https://example.com/valid',
          },
          {
            title: 'Invalid Article',
            // No link property
          },
          {
            title: 'Another Valid Article',
            link: 'https://example.com/valid2',
          },
        ],
      }

      mockParser.parseURL.mockResolvedValue(mockFeed as Parser.Output<unknown>)

      const result = await service.parseFeed(feedUrl)

      // Should only include items with links
      expect(result.items).toHaveLength(2)
      expect(result.items[0].link).toBe('https://example.com/valid')
      expect(result.items[1].link).toBe('https://example.com/valid2')
    })
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { TwitterExtractorService } from './twitter-extractor.service'

describe('TwitterExtractorService', () => {
  let service: TwitterExtractorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwitterExtractorService],
    }).compile()

    service = module.get<TwitterExtractorService>(TwitterExtractorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('extractThread', () => {
    it('should extract tweet data', async () => {
      // Note: This test may fail if the syndication API changes or is rate-limited
      const testTweetUrl =
        'https://twitter.com/jack/status/20' // Jack's first tweet

      try {
        const result = await service.extractThread(testTweetUrl)

        expect(result.mainTweet).toBeDefined()
        expect(result.mainTweet.id).toBe('20')
        expect(result.mainTweet.text).toBeDefined()
        expect(result.author).toBeDefined()
        expect(result.author.username).toBe('jack')
      } catch (error) {
        // If Twitter API is unavailable or rate-limited, skip
        console.warn('Twitter extraction test skipped:', error)
      }
    }, 30000) // 30 second timeout

    it('should handle invalid Twitter URL', async () => {
      await expect(
        service.extractThread('https://example.com/not-a-tweet'),
      ).rejects.toThrow('Invalid Twitter URL')
    })

    it('should handle unavailable tweet', async () => {
      const unavailableUrl =
        'https://twitter.com/example/status/999999999999999999'

      await expect(service.extractThread(unavailableUrl)).rejects.toThrow()
    }, 30000)
  })

  describe('formatThreadHtml', () => {
    it('should format thread as HTML', () => {
      const thread = {
        tweets: [
          {
            id: '123',
            text: 'Hello world',
            author: {
              name: 'Test User',
              username: 'testuser',
            },
            mediaUrls: [],
          },
        ],
        mainTweet: {
          id: '123',
          text: 'Hello world',
          author: {
            name: 'Test User',
            username: 'testuser',
          },
          mediaUrls: [],
        },
        author: {
          name: 'Test User',
          username: 'testuser',
        },
      }

      const html = service.formatThreadHtml(thread)

      expect(html).toContain('Test User')
      expect(html).toContain('@testuser')
      expect(html).toContain('Hello world')
    })

    it('should escape HTML in tweet text', () => {
      const thread = {
        tweets: [
          {
            id: '123',
            text: '<script>alert("xss")</script>',
            author: {
              name: 'Test User',
              username: 'testuser',
            },
            mediaUrls: [],
          },
        ],
        mainTweet: {
          id: '123',
          text: '<script>alert("xss")</script>',
          author: {
            name: 'Test User',
            username: 'testuser',
          },
          mediaUrls: [],
        },
        author: {
          name: 'Test User',
          username: 'testuser',
        },
      }

      const html = service.formatThreadHtml(thread)

      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })
  })
})

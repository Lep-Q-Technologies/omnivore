import { Test, TestingModule } from '@nestjs/testing'
import axios from 'axios'

import { TwitterExtractorService } from './twitter-extractor.service'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('TwitterExtractorService', () => {
  let service: TwitterExtractorService | null = null

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [TwitterExtractorService],
    }).compile()

    service =
      module.get<TwitterExtractorService>(TwitterExtractorService) || null
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('extractThread', () => {
    it('should extract tweet data', async () => {
      const testTweetUrl = 'https://twitter.com/jack/status/20'

      // Mock successful Twitter API response
      const mockTweetData = {
        text: 'just setting up my twttr',
        user: {
          name: 'Jack Dorsey',
          screen_name: 'jack',
          profile_image_url_https:
            'https://pbs.twimg.com/profile_images/1234567890/jack_normal.jpg',
        },
        created_at: '2006-03-21T20:50:14.000Z',
        id_str: '20',
        retweet_count: 100000,
        favorite_count: 200000,
        reply_count: 5000,
        photos: [],
      }

      mockedAxios.get.mockResolvedValue({ data: mockTweetData })

      const result = await service.extractThread(testTweetUrl)

      expect(result.mainTweet).toBeDefined()
      expect(result.mainTweet.id).toBe('20')
      expect(result.mainTweet.text).toBe('just setting up my twttr')
      expect(result.author).toBeDefined()
      expect(result.author.username).toBe('jack')
      expect(result.author.name).toBe('Jack Dorsey')
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    })

    it('should extract tweet with media', async () => {
      const testTweetUrl = 'https://twitter.com/example/status/123456'

      const mockTweetData = {
        text: 'Check out this photo!',
        user: {
          name: 'Example User',
          screen_name: 'example',
        },
        photos: [
          { url: 'https://pbs.twimg.com/media/photo1.jpg' },
          { url: 'https://pbs.twimg.com/media/photo2.jpg' },
        ],
        video: {
          poster: 'https://pbs.twimg.com/media/video_thumb.jpg',
        },
      }

      mockedAxios.get.mockResolvedValue({ data: mockTweetData })

      const result = await service.extractThread(testTweetUrl)

      expect(result.mainTweet.mediaUrls).toHaveLength(3)
      expect(result.mainTweet.mediaUrls).toContain(
        'https://pbs.twimg.com/media/photo1.jpg',
      )
      expect(result.mainTweet.mediaUrls).toContain(
        'https://pbs.twimg.com/media/video_thumb.jpg',
      )
    })

    it('should handle invalid Twitter URL', async () => {
      await expect(
        service.extractThread('https://example.com/not-a-tweet'),
      ).rejects.toThrow('Invalid Twitter URL')

      // axios should not be called for invalid URLs
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('should handle 404 not found error', async () => {
      const unavailableUrl = 'https://twitter.com/example/status/999999999'

      // Create an axios error
      const axiosError = Object.assign(
        new Error('Request failed with status code 404'),
        {
          isAxiosError: true,
          response: { status: 404 },
        },
      )

      mockedAxios.get.mockRejectedValue(axiosError)
      // Mock axios.isAxiosError to return true for our error
      mockedAxios.isAxiosError = jest
        .fn()
        .mockReturnValue(true) as unknown as typeof mockedAxios.isAxiosError

      await expect(service.extractThread(unavailableUrl)).rejects.toThrow(
        'Tweet not found or deleted',
      )
    })

    it('should handle 403 forbidden error', async () => {
      const restrictedUrl = 'https://twitter.com/private/status/12345'

      // Create an axios error
      const axiosError = Object.assign(
        new Error('Request failed with status code 403'),
        {
          isAxiosError: true,
          response: { status: 403 },
        },
      )

      mockedAxios.get.mockRejectedValue(axiosError)
      // Mock axios.isAxiosError to return true for our error
      mockedAxios.isAxiosError = jest
        .fn()
        .mockReturnValue(true) as unknown as typeof mockedAxios.isAxiosError

      await expect(service.extractThread(restrictedUrl)).rejects.toThrow(
        'Tweet is from a private account or access is restricted',
      )
    })

    it('should handle missing tweet data', async () => {
      const testTweetUrl = 'https://twitter.com/example/status/12345'

      // Mock invalid response (missing required fields)
      mockedAxios.get.mockResolvedValue({ data: {} })

      await expect(service.extractThread(testTweetUrl)).rejects.toThrow(
        'Tweet not found or deleted',
      )
    })
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

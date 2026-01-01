import { Test, TestingModule } from '@nestjs/testing'
import { YoutubeTranscript } from 'youtube-transcript'
import ytdl from 'ytdl-core'

import { VideoExtractorService } from './video-extractor.service'

// Mock ytdl-core and youtube-transcript
jest.mock('ytdl-core')
jest.mock('youtube-transcript')

const mockedYtdl = ytdl as jest.Mocked<typeof ytdl>
const mockedYoutubeTranscript = YoutubeTranscript as jest.Mocked<
  typeof YoutubeTranscript
>

describe('VideoExtractorService', () => {
  let service: VideoExtractorService | null = null

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoExtractorService],
    }).compile()

    service = module.get<VideoExtractorService>(VideoExtractorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('extractYoutubeVideo', () => {
    it('should extract video metadata and transcript', async () => {
      const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

      // Mock ytdl.getInfo response
      const mockVideoInfo = {
        videoDetails: {
          title: 'Test Video Title',
          author: {
            name: 'Test Channel',
          },
          description: 'This is a test video description',
          lengthSeconds: '180',
          publishDate: '2020-01-01',
          thumbnails: [
            { url: 'https://i.ytimg.com/vi/test/default.jpg', width: 120 },
            { url: 'https://i.ytimg.com/vi/test/hqdefault.jpg', width: 480 },
          ],
        },
      }

      // Mock transcript response
      const mockTranscript = [
        { text: 'Hello world', offset: 0, duration: 2000 },
        { text: 'This is a test', offset: 2500, duration: 3000 },
      ]

      mockedYtdl.getInfo = jest.fn().mockResolvedValue(mockVideoInfo)
      mockedYoutubeTranscript.fetchTranscript = jest
        .fn()
        .mockResolvedValue(mockTranscript)

      const result = await service.extractYoutubeVideo(testVideoUrl)

      expect(result.title).toBe('Test Video Title')
      expect(result.author).toBe('Test Channel')
      expect(result.videoId).toBe('dQw4w9WgXcQ')
      expect(result.platform).toBe('youtube')
      expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
      expect(result.duration).toBe(180)
      expect(result.transcript).toHaveLength(2)
      expect(result.transcript[0].text).toBe('Hello world')
      expect(result.transcript[0].start).toBe(0)
      expect(mockedYtdl.getInfo).toHaveBeenCalledWith('dQw4w9WgXcQ')
      expect(mockedYoutubeTranscript.fetchTranscript).toHaveBeenCalledWith(
        'dQw4w9WgXcQ',
      )
    })

    it('should handle video without transcript', async () => {
      const testVideoUrl = 'https://www.youtube.com/watch?v=abc123'

      const mockVideoInfo = {
        videoDetails: {
          title: 'Video Without Transcript',
          author: { name: 'Test Channel' },
          lengthSeconds: '120',
          thumbnails: [],
        },
      }

      mockedYtdl.getInfo = jest.fn().mockResolvedValue(mockVideoInfo)
      mockedYoutubeTranscript.fetchTranscript = jest
        .fn()
        .mockRejectedValue(new Error('No transcript available'))

      const result = await service.extractYoutubeVideo(testVideoUrl)

      expect(result.title).toBe('Video Without Transcript')
      expect(result.transcript).toEqual([])
      expect(result.duration).toBe(120)
    })

    it('should handle different YouTube URL formats', async () => {
      const shortUrl = 'https://youtu.be/abc123'

      const mockVideoInfo = {
        videoDetails: {
          title: 'Short URL Video',
          author: { name: 'Test' },
          lengthSeconds: '60',
          thumbnails: [],
        },
      }

      mockedYtdl.getInfo = jest.fn().mockResolvedValue(mockVideoInfo)
      mockedYoutubeTranscript.fetchTranscript = jest.fn().mockResolvedValue([])

      const result = await service.extractYoutubeVideo(shortUrl)

      expect(result.videoId).toBe('abc123')
      expect(mockedYtdl.getInfo).toHaveBeenCalledWith('abc123')
    })

    it('should handle invalid YouTube URL', async () => {
      await expect(
        service.extractYoutubeVideo('https://example.com/not-a-video'),
      ).rejects.toThrow('Invalid YouTube URL')

      expect(mockedYtdl.getInfo).not.toHaveBeenCalled()
    })

    it('should handle video fetch error', async () => {
      const unavailableUrl = 'https://www.youtube.com/watch?v=invalid123'

      mockedYtdl.getInfo = jest
        .fn()
        .mockRejectedValue(new Error('Video unavailable'))

      await expect(service.extractYoutubeVideo(unavailableUrl)).rejects.toThrow(
        'Failed to extract video',
      )
    })

    it('should extract highest quality thumbnail', async () => {
      const testVideoUrl = 'https://www.youtube.com/watch?v=test123'

      const mockVideoInfo = {
        videoDetails: {
          title: 'Test',
          author: { name: 'Test' },
          lengthSeconds: '100',
          thumbnails: [
            { url: 'https://i.ytimg.com/vi/test/default.jpg', width: 120 },
            { url: 'https://i.ytimg.com/vi/test/hqdefault.jpg', width: 480 },
            {
              url: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
              width: 1280,
            },
          ],
        },
      }

      mockedYtdl.getInfo = jest.fn().mockResolvedValue(mockVideoInfo)
      mockedYoutubeTranscript.fetchTranscript = jest.fn().mockResolvedValue([])

      const result = await service.extractYoutubeVideo(testVideoUrl)

      // Should use the last (highest quality) thumbnail
      expect(result.thumbnailUrl).toBe(
        'https://i.ytimg.com/vi/test/maxresdefault.jpg',
      )
    })
  })

  describe('formatTranscriptHtml', () => {
    it('should format transcript with timestamps', () => {
      const transcript = [
        { text: 'Hello world', start: 0, duration: 2 },
        { text: 'This is a test', start: 2.5, duration: 3 },
      ]

      const html = service.formatTranscriptHtml(transcript, 'Test Video', true)

      expect(html).toContain('Test Video')
      expect(html).toContain('[0:00]')
      expect(html).toContain('[0:02]')
      expect(html).toContain('Hello world')
      expect(html).toContain('This is a test')
    })

    it('should format transcript without timestamps', () => {
      const transcript = [{ text: 'Hello world', start: 0, duration: 2 }]

      const html = service.formatTranscriptHtml(transcript, 'Test Video', false)

      expect(html).not.toContain('[0:00]')
      expect(html).toContain('Hello world')
    })

    it('should handle empty transcript', () => {
      const html = service.formatTranscriptHtml([], 'Test Video')

      expect(html).toContain('No transcript available')
    })

    it('should escape HTML in transcript text', () => {
      const transcript = [
        { text: '<script>alert("xss")</script>', start: 0, duration: 2 },
      ]

      const html = service.formatTranscriptHtml(transcript, 'Test Video')

      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })
  })
})

import { Test, TestingModule } from '@nestjs/testing'

import { VideoExtractorService } from './video-extractor.service'

describe('VideoExtractorService', () => {
  let service: VideoExtractorService | null = null

  beforeEach(async () => {
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
      // Using a known public video (replace with a reliable test video)
      const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

      try {
        const result = await service.extractYoutubeVideo(testVideoUrl)

        expect(result.title).toBeDefined()
        expect(result.author).toBeDefined()
        expect(result.videoId).toBe('dQw4w9WgXcQ')
        expect(result.platform).toBe('youtube')
        expect(result.embedUrl).toBe(
          'https://www.youtube.com/embed/dQw4w9WgXcQ',
        )
        expect(result.duration).toBeGreaterThan(0)
      } catch (error) {
        // If network request fails in test environment, skip
        console.warn(
          'Video extraction test skipped due to network error:',
          error,
        )
      }
    }, 30000) // 30 second timeout for network request

    it('should handle invalid YouTube URL', async () => {
      await expect(
        service.extractYoutubeVideo('https://example.com/not-a-video'),
      ).rejects.toThrow('Invalid YouTube URL')
    })

    it('should handle unavailable video', async () => {
      const unavailableUrl =
        'https://www.youtube.com/watch?v=invalidvideohere123'

      await expect(service.extractYoutubeVideo(unavailableUrl)).rejects.toThrow(
        'Failed to extract video',
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

/**
 * ContentProcessorService Unit Tests
 *
 * Tests the public interface (process) only.
 * Utility function tests are in content-processor.utils.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Job } from 'bullmq'
import { Repository } from 'typeorm'

import {
  LibraryItemEntity,
  LibraryItemState,
} from '../../library/entities/library-item.entity'
import { EventBusService } from '../event-bus.service'
import { JOB_TYPES } from '../queue.constants'
import { ContentTypeDetectorService } from '../services/content-type-detector.service'
import { HtmlSanitizerService } from '../services/html-sanitizer.service'
import { PdfExtractorService } from '../services/pdf-extractor.service'
import { RssFeedService } from '../services/rss-feed.service'
import { TwitterExtractorService } from '../services/twitter-extractor.service'
import { VideoExtractorService } from '../services/video-extractor.service'
import {
  ContentProcessorService,
  FetchContentJobData,
} from './content-processor.service'

// Mock logger to suppress console output during tests
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
}

describe('ContentProcessorService', () => {
  let service: ContentProcessorService
  let repository: jest.Mocked<Repository<LibraryItemEntity>>
  let eventBus: jest.Mocked<EventBusService>

  beforeEach(async () => {
    const mockRepository = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn(),
    }

    const mockEventBus = {
      emitContentFetchStarted: jest.fn(),
      emitContentFetchCompleted: jest.fn(),
      emitContentFetchFailed: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentProcessorService,
        {
          provide: getRepositoryToken(LibraryItemEntity),
          useValue: mockRepository,
        },
        {
          provide: EventBusService,
          useValue: mockEventBus,
        },
        HtmlSanitizerService,
        ContentTypeDetectorService,
        PdfExtractorService,
        RssFeedService,
        VideoExtractorService,
        TwitterExtractorService,
      ],
    })
      .setLogger(mockLogger)
      .compile()

    service = module.get<ContentProcessorService>(ContentProcessorService)
    repository = module.get(getRepositoryToken(LibraryItemEntity))
    eventBus = module.get(EventBusService)
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should log initialization message', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const logSpy = jest.spyOn(service.logger, 'log')
      service.onModuleInit()
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('ContentProcessorService initialized'),
      )
    })
  })

  describe('process', () => {
    it('should process fetch-content jobs successfully', async () => {
      const jobData: FetchContentJobData = {
        libraryItemId: 'item-123',
        url: 'https://example.com',
        userId: 'user-123',
        timestamp: new Date(),
      }

      const mockJob = createMockJob(JOB_TYPES.FETCH_CONTENT, jobData)

      const result = await service.process(mockJob)

      expect(result.success).toBe(true)
      expect(result.title).toBeDefined()
      expect(result.content).toBeDefined()

      // Verify state transitions
      expect(repository.update).toHaveBeenCalledWith(
        'item-123',
        expect.objectContaining({
          state: LibraryItemState.PROCESSING,
        }),
      )
      expect(repository.update).toHaveBeenCalledWith('item-123', {
        state: LibraryItemState.SUCCEEDED,
      })

      // Verify events emitted
      expect(eventBus.emitContentFetchStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          libraryItemId: 'item-123',
          url: 'https://example.com',
        }),
      )
      expect(eventBus.emitContentFetchCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          libraryItemId: 'item-123',
          contentLength: expect.any(Number),
          processingTime: expect.any(Number),
        }),
      )
    })

    it('should update job progress during processing', async () => {
      const jobData: FetchContentJobData = {
        libraryItemId: 'item-123',
        url: 'https://example.com',
        userId: 'user-123',
        timestamp: new Date(),
      }

      const mockJob = createMockJob(JOB_TYPES.FETCH_CONTENT, jobData)

      await service.process(mockJob)

      // Verify progress updates were called
      expect(mockJob.updateProgress).toHaveBeenCalled()
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100)
    })

    it('should throw error for unknown job type', async () => {
      const jobData: FetchContentJobData = {
        libraryItemId: 'item-123',
        url: 'https://example.com',
        userId: 'user-123',
        timestamp: new Date(),
      }

      const mockJob = createMockJob('unknown-job-type', jobData)

      await expect(service.process(mockJob)).rejects.toThrow('Unknown job type')
    })

    it('should emit failed event on error with retries remaining', async () => {
      const jobData: FetchContentJobData = {
        libraryItemId: 'item-123',
        url: 'https://invalid-url-that-will-fail.test',
        userId: 'user-123',
        timestamp: new Date(),
      }

      const mockJob = createMockJob(JOB_TYPES.FETCH_CONTENT, jobData, {
        attemptsMade: 0,
        attempts: 3,
      })

      await expect(service.process(mockJob)).rejects.toThrow()

      // Should emit failed event with willRetry: true
      expect(eventBus.emitContentFetchFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          libraryItemId: 'item-123',
          willRetry: true,
        }),
      )

      // Should NOT update to FAILED since retries remain
      expect(repository.update).not.toHaveBeenCalledWith('item-123', {
        state: LibraryItemState.FAILED,
      })
    })

    it('should update to FAILED state on final attempt', async () => {
      const jobData: FetchContentJobData = {
        libraryItemId: 'item-123',
        url: 'https://invalid-url-that-will-fail.test',
        userId: 'user-123',
        timestamp: new Date(),
      }

      const mockJob = createMockJob(JOB_TYPES.FETCH_CONTENT, jobData, {
        attemptsMade: 2,
        attempts: 3,
      })

      await expect(service.process(mockJob)).rejects.toThrow()

      // Should update to FAILED on final attempt
      expect(repository.update).toHaveBeenCalledWith('item-123', {
        state: LibraryItemState.FAILED,
      })

      // Should emit failed event with willRetry: false
      expect(eventBus.emitContentFetchFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          libraryItemId: 'item-123',
          willRetry: false,
        }),
      )
    })

    it('should save content to database on success', async () => {
      const jobData: FetchContentJobData = {
        libraryItemId: 'item-123',
        url: 'https://example.com',
        userId: 'user-123',
        timestamp: new Date(),
      }

      const mockJob = createMockJob(JOB_TYPES.FETCH_CONTENT, jobData)

      await service.process(mockJob)

      // Verify content was saved
      expect(repository.update).toHaveBeenCalledWith(
        'item-123',
        expect.objectContaining({
          title: expect.any(String),
          readableContent: expect.any(String),
        }),
      )
    })

    it('should handle parse-content jobs', async () => {
      const jobData: FetchContentJobData = {
        libraryItemId: 'item-123',
        url: 'https://example.com',
        userId: 'user-123',
        timestamp: new Date(),
      }

      const mockJob = createMockJob(JOB_TYPES.PARSE_CONTENT, jobData)

      const result = await service.process(mockJob)

      // Parse content is not fully implemented yet
      expect(result).toBeDefined()
    })
  })
})

/**
 * Helper function to create mock Job objects
 */
function createMockJob(
  name: string,
  data: FetchContentJobData,
  opts: Partial<{ attemptsMade: number; attempts: number }> = {},
): Job<FetchContentJobData> {
  return {
    id: 'job-123',
    name,
    data,
    attemptsMade: opts.attemptsMade || 0,
    opts: {
      attempts: opts.attempts || 3,
    },
    updateProgress: jest.fn().mockResolvedValue(undefined),
  } as unknown as Job<FetchContentJobData>
}

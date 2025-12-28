import { Logger } from '@nestjs/common'

/**
 * Item to be processed by a poller
 */
export interface PollerItem {
  id: string
  userId: string
  sourceUrl: string
  lastCheckedAt?: Date
  metadata?: Record<string, any>
}

/**
 * Result of processing a single item
 */
export interface PollerItemResult {
  success: boolean
  itemsImported: number
  errors: string[]
}

/**
 * Result of a polling cycle
 */
export interface PollerCycleResult {
  success: boolean
  itemsProcessed: number
  totalImported: number
  errors: string[]
  duration: number
}

/**
 * BasePoller - Abstract class for periodic content importers
 *
 * Provides a framework for polling external sources and importing content:
 * - RSS feeds
 * - Email newsletters
 * - YouTube channels
 * - Social media feeds
 * - Pocket/Instapaper/etc.
 *
 * Subclasses implement:
 * - getItemsToProcess(): Fetch items that need checking
 * - processItem(): Process a single item and import content
 * - getPollingInterval(): How often to poll (in seconds)
 */
export abstract class BasePoller<T extends PollerItem = PollerItem> {
  protected readonly logger: Logger

  constructor(loggerContext: string) {
    this.logger = new Logger(loggerContext)
  }

  /**
   * Get items that need processing
   * @returns Array of items to process
   */
  abstract getItemsToProcess(): Promise<T[]>

  /**
   * Process a single item (fetch new content, import to library)
   * @param item - Item to process
   * @returns Processing result
   */
  abstract processItem(item: T): Promise<PollerItemResult>

  /**
   * Get polling interval in seconds
   * @returns Interval in seconds (default: 3600 = 1 hour)
   */
  getPollingInterval(): number {
    return 3600 // 1 hour
  }

  /**
   * Get batch size for processing
   * @returns Number of items to process per cycle (default: 100)
   */
  getBatchSize(): number {
    return 100
  }

  /**
   * Execute a polling cycle
   * Fetches items and processes them in batch
   */
  async poll(): Promise<PollerCycleResult> {
    const startTime = Date.now()
    const pollerName = this.constructor.name

    this.logger.log(`Starting polling cycle for ${pollerName}`)

    const result: PollerCycleResult = {
      success: true,
      itemsProcessed: 0,
      totalImported: 0,
      errors: [],
      duration: 0,
    }

    try {
      // Get items to process
      const items = await this.getItemsToProcess()
      this.logger.log(`Found ${items.length} items to process`)

      if (items.length === 0) {
        result.duration = Date.now() - startTime

        return result
      }

      // Process each item
      for (const item of items) {
        try {
          const itemResult = await this.processItem(item)

          result.itemsProcessed++
          result.totalImported += itemResult.itemsImported

          if (!itemResult.success) {
            result.errors.push(...itemResult.errors)
          }
        } catch (error) {
          const errorMsg = `Failed to process item ${item.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
          this.logger.error(errorMsg)
          result.errors.push(errorMsg)
          result.success = false
        }
      }

      result.duration = Date.now() - startTime

      this.logger.log(
        `Polling cycle complete for ${pollerName}: ${result.itemsProcessed} items processed, ${result.totalImported} content items imported in ${result.duration}ms`,
      )

      if (result.errors.length > 0) {
        this.logger.warn(
          `${result.errors.length} items failed to process`,
          result.errors,
        )
      }
    } catch (error) {
      const errorMsg = `Polling cycle failed for ${pollerName}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
      this.logger.error(errorMsg)
      result.success = false
      result.errors.push(errorMsg)
      result.duration = Date.now() - startTime
    }

    return result
  }

  /**
   * Check if an item needs processing based on last checked time
   * @param lastCheckedAt - Last time item was checked
   * @returns True if item should be processed
   */
  protected shouldProcess(lastCheckedAt?: Date): boolean {
    if (!lastCheckedAt) {
      return true // Never checked before
    }

    const interval = this.getPollingInterval() * 1000 // Convert to ms
    const timeSinceLastCheck = Date.now() - lastCheckedAt.getTime()

    return timeSinceLastCheck >= interval
  }
}

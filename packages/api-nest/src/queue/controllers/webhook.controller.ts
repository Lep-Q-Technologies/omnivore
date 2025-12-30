import { InjectQueue } from '@nestjs/bullmq'
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue } from 'bullmq'

import { EnvVariables } from '../../config/env-variables'
import { PostmarkInboundEmailDto } from '../dto/postmark-inbound.dto'
import { SaveNewsletterJobData } from '../processors/email-processor.service'
import { JOB_TYPES, QUEUE_NAMES } from '../queue.constants'
/**
 * Webhook Controller for handling inbound emails from Postmark
 *
 * This controller receives POST requests from Postmark's inbound webhook
 * and queues the emails for processing by the EmailProcessorService.
 *
 * Postmark Webhook Documentation:
 * https://postmarkapp.com/developer/webhooks/inbound-webhook
 */
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name)

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL_PROCESSING)
    private readonly emailQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Handle inbound email webhook from Postmark
   *
   * POST /webhooks/postmark/inbound
   *
   * @param payload - Postmark inbound email payload
   * @returns 200 OK response to acknowledge receipt
   */
  @Post('postmark/inbound')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
    }),
  )
  async handlePostmarkInbound(
    @Body() payload: PostmarkInboundEmailDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      this.logger.log(
        `Received inbound email from ${payload.From} to ${payload.To}`,
      )
      this.logger.debug(`Subject: ${payload.Subject}`)
      this.logger.debug(`MessageID: ${payload.MessageID}`)

      // Extract unsubscribe information from headers
      const unsubMailTo = this.extractUnsubscribeMailTo(payload.Headers)
      const unsubHttpUrl = this.extractUnsubscribeHttpUrl(payload.Headers)

      // Transform Postmark payload to SaveNewsletterJobData format
      const jobData: SaveNewsletterJobData = {
        from: payload.From,
        to: payload.To,
        subject: payload.Subject,
        html: payload.HtmlBody,
        text: payload.TextBody,
        headers: this.transformHeaders(payload.Headers),
        unsubMailTo,
        unsubHttpUrl,
        forwardedFrom: payload.OriginalRecipient,
        replyTo: payload.FromFull?.Email,
      }

      const jobType = this.resolveJobType(headers)

      // Queue the email for processing
      const job = await this.emailQueue.add(jobType, jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failures for 7 days
        },
      })

      this.logger.log(`Queued ${jobType} job ${job.id} for ${payload.From}`)

      return {
        success: true,
        message: `Email queued for processing (job ${job.id})`,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : null

      this.logger.error(
        `Failed to process inbound email: ${errorMessage}`,
        errorStack,
      )

      // Still return 200 to Postmark to avoid retries
      // Log the error for investigation
      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  /**
   * Extract List-Unsubscribe mailto: link from headers
   */
  private extractUnsubscribeMailTo(
    headers?: Array<{ Name: string; Value: string } | [string, string]>,
  ): string | null {
    const normalizedHeaders = this.normalizeHeaders(headers)
    if (!normalizedHeaders) {
      return null
    }

    const unsubHeader = normalizedHeaders.find(
      (h) => h.Name.toLowerCase() === 'list-unsubscribe',
    )

    if (!unsubHeader) {
      return null
    }

    // Extract mailto: link from header value
    // Format: <mailto:unsubscribe@example.com?subject=...>, <http://...>
    const mailtoMatch = unsubHeader.Value.match(/mailto:([^>?]+)/)

    return mailtoMatch ? mailtoMatch[1] : null
  }

  /**
   * Extract List-Unsubscribe HTTP URL from headers
   */
  private extractUnsubscribeHttpUrl(
    headers?: Array<{ Name: string; Value: string } | [string, string]>,
  ): string | null {
    const normalizedHeaders = this.normalizeHeaders(headers)
    if (!normalizedHeaders) {
      return null
    }

    const unsubHeader = normalizedHeaders.find(
      (h) => h.Name.toLowerCase() === 'list-unsubscribe',
    )

    if (!unsubHeader) {
      return null
    }

    // Extract http/https URL from header value
    const urlMatch = unsubHeader.Value.match(/<(https?:\/\/[^>]+)>/)

    return urlMatch ? urlMatch[1] : null
  }

  /**
   * Transform Postmark headers array to Record format
   */
  private transformHeaders(
    headers?: Array<{ Name: string; Value: string } | [string, string]>,
  ): Record<string, string | string[]> | null {
    const normalizedHeaders = this.normalizeHeaders(headers)
    if (!normalizedHeaders || normalizedHeaders.length === 0) {
      return null
    }

    const result: Record<string, string | string[]> = {}

    for (const header of normalizedHeaders) {
      const key = header.Name
      const value = header.Value

      // If header already exists, convert to array
      if (result[key]) {
        if (Array.isArray(result[key])) {
          ;(result[key] as string[]).push(value)
        } else {
          result[key] = [result[key] as string, value]
        }
      } else {
        result[key] = value
      }
    }

    return result
  }

  /**
   * Normalize inbound headers to a Name/Value shape and drop malformed entries.
   * Postmark can send headers as arrays (e.g., [name, value]) depending on format.
   */
  private normalizeHeaders(
    headers?: Array<{ Name: string; Value: string } | [string, string]>,
  ): Array<{ Name: string; Value: string }> | null {
    if (!headers || headers.length === 0) {
      return null
    }

    return headers
      .map((header) => {
        if (Array.isArray(header)) {
          const [Name, Value] = header
          if (typeof Name === 'string' && typeof Value === 'string') {
            return { Name, Value }
          }

          return null
        }

        if (
          header &&
          typeof header === 'object' &&
          typeof header.Name === 'string' &&
          typeof header.Value === 'string'
        ) {
          return { Name: header.Name, Value: header.Value }
        }

        return null
      })
      .filter((header): header is { Name: string; Value: string } => !!header)
  }

  /**
   * Resolve the job type from headers when a test token is provided.
   */
  private resolveJobType(
    headers: Record<string, string | string[] | undefined>,
  ): string {
    const requestedJob = this.readHeader(headers, 'x-omnivore-webhook-job')
    if (!requestedJob) {
      return JOB_TYPES.SAVE_NEWSLETTER
    }

    const testToken = this.configService.get<string>(
      EnvVariables.WEBHOOK_TEST_TOKEN,
    )
    const requestToken = this.readHeader(headers, 'x-omnivore-webhook-token')

    if (!testToken || requestToken !== testToken) {
      this.logger.warn(
        `Webhook job override rejected for ${requestedJob}: missing or invalid token`,
      )

      return JOB_TYPES.SAVE_NEWSLETTER
    }

    const allowedJobs = new Set<string>([
      JOB_TYPES.SAVE_NEWSLETTER,
      JOB_TYPES.CONFIRMATION_EMAIL,
    ])

    if (!allowedJobs.has(requestedJob)) {
      this.logger.warn(`Webhook job override rejected: ${requestedJob}`)

      return JOB_TYPES.SAVE_NEWSLETTER
    }

    return requestedJob
  }

  private readHeader(
    headers: Record<string, string | string[] | undefined>,
    key: string,
  ): string | null {
    const value = headers[key]

    if (Array.isArray(value)) {
      return value[0] ?? null
    }

    return value ?? null
  }
}

import { InjectQueue } from '@nestjs/bullmq'
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common'
import { Queue } from 'bullmq'

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
  async handlePostmarkInbound(
    @Body() payload: PostmarkInboundEmailDto,
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

      // Queue the email for processing
      const job = await this.emailQueue.add(
        JOB_TYPES.SAVE_NEWSLETTER,
        jobData,
        {
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
        },
      )

      this.logger.log(
        `Queued email processing job ${job.id} for ${payload.From}`,
      )

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
    headers?: Array<{ Name: string; Value: string }>,
  ): string | null {
    if (!headers) {
      return null
    }

    const unsubHeader = headers.find(
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
    headers?: Array<{ Name: string; Value: string }>,
  ): string | null {
    if (!headers) {
      return null
    }

    const unsubHeader = headers.find(
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
    headers?: Array<{ Name: string; Value: string }>,
  ): Record<string, string | string[]> | null {
    if (!headers || headers.length === 0) {
      return null
    }

    const result: Record<string, string | string[]> = {}

    for (const header of headers) {
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
}

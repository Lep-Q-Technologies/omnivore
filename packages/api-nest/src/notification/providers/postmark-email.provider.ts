import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

import { EnvVariables } from '../../config/env-variables'
import {
  EmailMessage,
  EmailSendResult,
  IEmailProvider,
} from '../interfaces/email.interface'

/**
 * Postmark email provider
 * Sends emails via Postmark API
 *
 * Environment variables required:
 * - POSTMARK_API_KEY: Server API token from Postmark
 * - POSTMARK_FROM_EMAIL: Default sender email (must be verified domain)
 */
@Injectable()
export class PostmarkEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(PostmarkEmailProvider.name)

  private readonly client: AxiosInstance

  private readonly fromEmail: string

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>(EnvVariables.POSTMARK_API_KEY)

    if (!apiKey) {
      this.logger.warn(
        'POSTMARK_API_KEY not configured, email sending disabled',
      )
    }

    this.fromEmail =
      this.configService.get<string>(EnvVariables.POSTMARK_FROM_EMAIL) ||
      'noreply@omnivore.app'

    this.client = axios.create({
      baseURL: 'https://api.postmarkapp.com',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': apiKey || '',
      },
      timeout: 10000, // 10 seconds
    })
  }

  /**
   * Send a single email via Postmark
   */
  async send(message: EmailMessage): Promise<EmailSendResult> {
    const apiKey = this.configService.get<string>(EnvVariables.POSTMARK_API_KEY)

    if (!apiKey) {
      this.logger.error('Cannot send email: POSTMARK_API_KEY not configured')

      return {
        success: false,
        error: 'Email service not configured',
      }
    }

    try {
      const payload = this.buildPostmarkPayload(message)

      this.logger.debug(`Sending email to ${message.to}`, {
        subject: message.subject,
      })

      const response = await this.client.post('/email', payload)

      this.logger.log(`Email sent successfully to ${message.to}`, {
        messageId: response.data.MessageID,
      })

      return {
        success: true,
        messageId: response.data.MessageID,
      }
    } catch (error) {
      this.logger.error('Failed to send email via Postmark', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: message.to,
        subject: message.subject,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send multiple emails in batch
   */
  async sendBatch(messages: EmailMessage[]): Promise<EmailSendResult[]> {
    const apiKey = this.configService.get<string>(EnvVariables.POSTMARK_API_KEY)

    if (!apiKey) {
      return messages.map(() => ({
        success: false,
        error: 'Email service not configured',
      }))
    }

    try {
      const payloads = messages.map((msg) => this.buildPostmarkPayload(msg))

      const response = await this.client.post('/email/batch', payloads)

      return response.data.map(
        (result: { ErrorCode: number; MessageID: string; Message: string }) => {
          if (result.ErrorCode === 0) {
            return {
              success: true,
              messageId: result.MessageID,
            }
          }

          return {
            success: false,
            error: result.Message,
          }
        },
      )
    } catch (error) {
      this.logger.error('Failed to send batch emails via Postmark', error)

      return messages.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }

  /**
   * Build Postmark API payload from EmailMessage
   */
  private buildPostmarkPayload(message: EmailMessage): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      From: message.from || this.fromEmail,
      To: Array.isArray(message.to) ? message.to.join(',') : message.to,
      Subject: message.subject,
    }

    if (message.html) {
      payload.HtmlBody = message.html
    }

    if (message.text) {
      payload.TextBody = message.text
    }

    if (message.replyTo) {
      payload.ReplyTo = message.replyTo
    }

    if (message.cc) {
      payload.Cc = Array.isArray(message.cc) ? message.cc.join(',') : message.cc
    }

    if (message.bcc) {
      payload.Bcc = Array.isArray(message.bcc)
        ? message.bcc.join(',')
        : message.bcc
    }

    if (message.attachments && message.attachments.length > 0) {
      payload.Attachments = message.attachments.map((att) => ({
        Name: att.filename,
        Content: att.content.toString('base64'),
        ContentType: att.contentType || 'application/octet-stream',
      }))
    }

    // Template support
    if (message.templateId) {
      payload.TemplateId = message.templateId
      payload.TemplateModel = message.templateData || {}
    }

    return payload
  }
}

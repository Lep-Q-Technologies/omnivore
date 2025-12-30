/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

/**
 * Email message structure
 */
export interface EmailMessage {
  to: string | string[]
  from?: string
  subject: string
  html?: string
  text?: string
  templateId?: string
  templateData?: Record<string, unknown>
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: EmailAttachment[]
}

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Email provider interface
 * Implement this for different providers (Postmark, SendGrid, AWS SES, etc.)
 */
export interface IEmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>
  sendBatch(messages: EmailMessage[]): Promise<EmailSendResult[]>
}

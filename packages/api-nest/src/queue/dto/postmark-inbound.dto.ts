/**
 * DTOs for Postmark Inbound Webhook Payload
 *
 * Based on Postmark's inbound webhook format:
 * https://postmarkapp.com/developer/webhooks/inbound-webhook
 */

import { Allow } from 'class-validator'

export interface PostmarkEmailAddress {
  Email: string
  Name: string
  MailboxHash?: string
}

export interface PostmarkAttachment {
  Name: string
  Content: string // Base64 encoded
  ContentType: string
  ContentLength: number
  ContentID?: string
}

export interface PostmarkHeader {
  Name: string
  Value: string
}

export class PostmarkInboundEmailDto {
  // Sender information
  @Allow()
  From: string // "sender@example.com"

  @Allow()
  FromName: string

  @Allow()
  FromFull: PostmarkEmailAddress

  // Recipient information
  @Allow()
  To: string // "recipient@example.com"

  @Allow()
  ToFull: PostmarkEmailAddress[]

  // CC and BCC
  @Allow()
  Cc?: string

  @Allow()
  CcFull?: PostmarkEmailAddress[]

  @Allow()
  Bcc?: string

  @Allow()
  BccFull?: PostmarkEmailAddress[]

  // Email content
  @Allow()
  Subject: string

  @Allow()
  TextBody: string

  @Allow()
  HtmlBody: string

  @Allow()
  StrippedTextReply?: string // Reply content with quoted text removed

  // Metadata
  @Allow()
  MessageID: string

  @Allow()
  Date: string // ISO 8601 format

  @Allow()
  MailboxHash?: string // The hash in the recipient address (e.g., "+abc123" in "user+abc123@domain.com")

  // Attachments
  @Allow()
  Attachments?: PostmarkAttachment[]

  // Headers
  @Allow()
  Headers?: Array<PostmarkHeader | [string, string]>

  // Tags (if configured in Postmark)
  @Allow()
  Tag?: string

  // Original recipient (before forwarding)
  @Allow()
  OriginalRecipient?: string
}

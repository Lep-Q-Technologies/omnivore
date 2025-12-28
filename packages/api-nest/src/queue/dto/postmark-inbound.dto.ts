/**
 * DTOs for Postmark Inbound Webhook Payload
 *
 * Based on Postmark's inbound webhook format:
 * https://postmarkapp.com/developer/webhooks/inbound-webhook
 */

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
  From: string // "sender@example.com"

  FromName: string

  FromFull: PostmarkEmailAddress

  // Recipient information
  To: string // "recipient@example.com"

  ToFull: PostmarkEmailAddress[]

  // CC and BCC
  Cc?: string

  CcFull?: PostmarkEmailAddress[]

  Bcc?: string

  BccFull?: PostmarkEmailAddress[]

  // Email content
  Subject: string

  TextBody: string

  HtmlBody: string

  StrippedTextReply?: string // Reply content with quoted text removed

  // Metadata
  MessageID: string

  Date: string // ISO 8601 format

  MailboxHash?: string // The hash in the recipient address (e.g., "+abc123" in "user+abc123@domain.com")

  // Attachments
  Attachments?: PostmarkAttachment[]

  // Headers
  Headers?: PostmarkHeader[]

  // Tags (if configured in Postmark)
  Tag?: string

  // Original recipient (before forwarding)
  OriginalRecipient?: string
}

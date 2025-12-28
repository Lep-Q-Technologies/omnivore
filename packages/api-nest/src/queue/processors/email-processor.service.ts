import { Readability } from '@mozilla/readability'
import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq'
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Job, Queue } from 'bullmq'
import { createHash } from 'crypto'
import { parseHTML } from 'linkedom'
import { Repository } from 'typeorm'

import {
  ContentType,
  LibraryItemEntity,
  LibraryItemState,
} from '../../library/entities/library-item.entity'
import { NewsletterPlatform } from '../../library/entities/pending-confirmation.entity'
import {
  SubscriptionEntity,
  SubscriptionSourceType,
} from '../../library/entities/subscription.entity'
import { NewsletterSubscriptionService } from '../../library/services/newsletter-subscription.service'
import { PendingConfirmationService } from '../../library/services/pending-confirmation.service'
import { User } from '../../user/entities/user.entity'
import { EventBusService } from '../event-bus.service'
import { JOB_PRIORITY, JOB_TYPES, QUEUE_NAMES } from '../queue.constants'
import { HtmlSanitizerService } from '../services/html-sanitizer.service'

/**
 * Job data interface for save-newsletter jobs
 * Matches the EmailJobData from inbound-email-handler
 */
export interface SaveNewsletterJobData {
  from: string
  to: string
  subject: string
  html?: string
  text?: string
  headers?: Record<string, string | string[]>
  unsubMailTo?: string
  unsubHttpUrl?: string
  forwardedFrom?: string
  replyTo?: string
}

/**
 * Extracted email metadata
 */
interface EmailMetadata {
  senderEmail: string
  senderName?: string
  subject: string
  title: string
  description?: string
  siteUrl?: string
  siteIcon?: string
}

@Injectable()
@Processor(QUEUE_NAMES.EMAIL_PROCESSING, {
  concurrency: 2, // Process 2 newsletter emails concurrently
})
export class EmailProcessorService
  extends WorkerHost
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EmailProcessorService.name)

  constructor(
    @InjectRepository(LibraryItemEntity)
    private readonly libraryItemRepository: Repository<LibraryItemEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly newsletterService: NewsletterSubscriptionService,
    private readonly pendingConfirmationService: PendingConfirmationService,
    private readonly eventBus: EventBusService,
    private readonly htmlSanitizer: HtmlSanitizerService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private readonly notificationQueue: Queue,
  ) {
    super()
  }

  onModuleInit() {
    this.logger.log('EmailProcessorService initialized')
  }

  async onModuleDestroy() {
    this.logger.log('EmailProcessorService shutting down...')
    try {
      await this.worker?.close()
      this.logger.log('EmailProcessorService shut down successfully')
    } catch (error) {
      this.logger.error(`Error during shutdown: ${error}`)
    }
  }

  /**
   * Main job processing method
   */
  async process(job: Job<SaveNewsletterJobData, any, string>): Promise<any> {
    this.logger.log(`Processing ${job.name} job ${job.id}`)

    switch (job.name) {
      case JOB_TYPES.SAVE_NEWSLETTER:
        return this.handleSaveNewsletter(job)
      case JOB_TYPES.FORWARD_EMAIL:
        return this.handleForwardEmail(job)
      case JOB_TYPES.CONFIRMATION_EMAIL:
        return this.handleConfirmationEmail(job)
      case JOB_TYPES.SAVE_ATTACHMENT:
        return this.handleSaveAttachment(job)
      default:
        this.logger.warn(`Unknown job type: ${job.name}`)

        return { success: false, error: 'Unknown job type' }
    }
  }

  /**
   * Handle save-newsletter jobs
   * This is the main newsletter ingestion pipeline
   */
  private async handleSaveNewsletter(
    job: Job<SaveNewsletterJobData>,
  ): Promise<any> {
    const { from, to, subject, html, text, unsubMailTo, unsubHttpUrl } =
      job.data

    try {
      // 1. Parse email metadata
      const metadata = this.extractEmailMetadata(from, subject, html, text)
      this.logger.log(
        `Newsletter from ${metadata.senderEmail}: "${metadata.title}"`,
      )

      // 2. Resolve user AND subscription from recipient email (new secure routing)
      const result = await this.resolveUserAndSubscription(to)
      if (!result) {
        throw new Error(`Could not resolve user from email: ${to}`)
      }

      const { user } = result
      let { subscription } = result

      this.logger.log(
        `Subscription: ${subscription.id} (${subscription.title}) for user ${user.id}`,
      )

      // 3. Update subscription with sender info if it's pending
      if (subscription.sourceIdentifier.startsWith('pending:')) {
        this.logger.log(
          `Updating pending subscription ${subscription.id} with sender ${metadata.senderEmail}`,
        )
        subscription = await this.newsletterService.findOrCreateByEmail(
          user.id,
          metadata.senderEmail,
          {
            title: metadata.title,
            description: metadata.description,
            siteUrl: metadata.siteUrl,
            siteIcon: metadata.siteIcon,
            unsubscribeMailTo: unsubMailTo,
            unsubscribeHttpUrl: unsubHttpUrl,
          },
        )
      }

      // Verify sender matches subscription (security check)
      if (
        !subscription.sourceIdentifier.startsWith('pending:') &&
        subscription.sourceIdentifier !== metadata.senderEmail
      ) {
        this.logger.warn(
          `Sender mismatch: expected ${subscription.sourceIdentifier}, got ${metadata.senderEmail}`,
        )
        // Still process but log the mismatch for security monitoring
      }

      // 3a. Auto-confirm any pending confirmations for this newsletter
      const wasConfirmed =
        await this.pendingConfirmationService.markAsConfirmed(
          metadata.senderEmail,
          user.id,
        )

      if (wasConfirmed) {
        this.logger.log(
          `Auto-confirmed pending confirmation for ${metadata.senderEmail}`,
        )
      }

      // 4. Extract and sanitize content
      const content = await this.extractNewsletterContent(html, text)

      // 5. Create library item
      const libraryItem = await this.createLibraryItem({
        userId: user.id,
        subscriptionId: subscription.id,
        title: metadata.title,
        content: content.html,
        description: metadata.description,
        originalUrl: metadata.siteUrl || `mailto:${metadata.senderEmail}`,
        author: metadata.senderName || metadata.senderEmail,
        publishedAt: new Date(),
        wordCount: content.wordCount,
        siteName: metadata.senderName,
        siteIcon: metadata.siteIcon,
      })

      // 6. Update subscription stats
      await this.subscriptionRepository.increment(
        { id: subscription.id },
        'itemCount',
        1,
      )
      await this.subscriptionRepository.update(
        { id: subscription.id },
        { lastFetchedAt: new Date() },
      )

      this.logger.log(`Created library item ${libraryItem.id} for newsletter`)

      return {
        success: true,
        libraryItemId: libraryItem.id,
        subscriptionId: subscription.id,
      }
    } catch (error) {
      this.logger.error(`Failed to process newsletter: ${error}`)
      throw error
    }
  }

  /**
   * Extract metadata from email
   */
  private extractEmailMetadata(
    from: string,
    subject: string,
    html?: string,
    _text?: string,
  ): EmailMetadata {
    // Parse sender email and name
    const { email: senderEmail, name: senderName } =
      this.parseEmailAddress(from)

    // Use subject as title, or try to extract from HTML
    let title = subject || 'Untitled Newsletter'
    let description: string | undefined
    let siteUrl: string | undefined
    let siteIcon: string | undefined

    if (html) {
      try {
        const { document } = parseHTML(html)

        // Try to extract title from HTML
        const h1 = document.querySelector('h1')
        if (h1?.textContent) {
          title = h1.textContent.trim()
        }

        // Try to extract meta description
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
          description = metaDesc.getAttribute('content') || undefined
        }

        // Try to extract site URL from links
        const links = document.querySelectorAll('a[href]')
        for (const link of Array.from(links)) {
          const href = link.getAttribute('href')
          if (
            href &&
            (href.startsWith('http://') || href.startsWith('https://'))
          ) {
            try {
              const url = new URL(href)
              siteUrl = `${url.protocol}//${url.host}`
              break
            } catch {
              // Invalid URL, continue
            }
          }
        }

        // Try to extract favicon
        const favicon = document.querySelector(
          'link[rel="icon"], link[rel="shortcut icon"]',
        )
        if (favicon) {
          siteIcon = favicon.getAttribute('href') || undefined
        }
      } catch (error) {
        this.logger.warn(`Failed to extract HTML metadata: ${error}`)
      }
    }

    return {
      senderEmail,
      senderName,
      subject,
      title,
      description,
      siteUrl,
      siteIcon,
    }
  }

  /**
   * Parse email address into name and email
   */
  private parseEmailAddress(address: string): { email: string; name?: string } {
    // Handle formats like: "Name <email@example.com>" or "email@example.com"
    const match = address.match(/^(?:"?([^"]*)"?\s)?<?([^@]+@[^>]+)>?$/)
    if (match) {
      return {
        name: match[1]?.trim() || undefined,
        email: match[2].trim(),
      }
    }

    return { email: address.trim() }
  }

  /**
   * Resolve user from recipient email address
   * Supports both direct user emails and newsletter alias emails
   */
  /**
   * Resolve user and subscription from recipient email
   * NEW: Uses subscription-only alias for better security
   * Format: {subscriptionAlias}@inbox.omnivore.app
   *
   * @returns {user, subscription} or null if not found
   */
  private async resolveUserAndSubscription(
    recipientEmail: string,
  ): Promise<{ user: User; subscription: SubscriptionEntity } | null> {
    const email = recipientEmail.toLowerCase()

    // Extract alias from email
    // Supports two formats:
    // 1. Subscription-specific: {subscriptionAlias}@inbox.omnivore.app
    // 2. User-level with subscription: {userAlias}+{subscriptionAlias}@inbox.omnivore.app
    const match = email.match(/^([a-z0-9]+)(?:\+([a-z0-9]+))?@/)
    if (!match) {
      this.logger.warn(`Invalid email format: ${email}`)

      return null
    }

    const userAlias = match[1]
    const subscriptionAlias = match[2] // Optional

    // If subscription alias is provided (format: user+subscription@), use that
    const emailAlias = subscriptionAlias || userAlias

    // Try to find subscription by email alias first
    let subscription = await this.subscriptionRepository.findOne({
      where: { emailAlias },
      relations: ['user'],
    })

    if (subscription) {
      // Get user from subscription
      const user =
        subscription.user ||
        (await this.userRepository.findOne({
          where: { id: subscription.userId },
        }))

      if (!user) {
        this.logger.error(`User not found for subscription ${subscription.id}`)
        return null
      }

      return { user, subscription }
    }

    // No subscription found - try to find user by email alias
    // This handles the case where emails are sent to user's general newsletter address
    const user = await this.userRepository.findOne({
      where: { emailAlias: userAlias },
    })

    if (!user) {
      this.logger.warn(
        `No subscription or user found for alias: ${userAlias}`,
      )
      return null
    }

    // Check if user already has a pending subscription - reuse it instead of creating new one
    const existingPendingSubscriptions = await this.subscriptionRepository.find(
      {
        where: { userId: user.id, sourceType: SubscriptionSourceType.NEWSLETTER },
      },
    )

    const pendingSubscription = existingPendingSubscriptions.find((sub) =>
      sub.sourceIdentifier.startsWith('pending:'),
    )

    if (pendingSubscription) {
      this.logger.log(
        `Reusing existing pending subscription ${pendingSubscription.id} for user ${user.id}`,
      )
      return { user, subscription: pendingSubscription }
    }

    // Auto-create a new pending subscription for this user
    // This subscription will be updated with actual sender info when email is processed
    this.logger.log(
      `Auto-creating pending subscription for user ${user.id} with alias ${emailAlias}`,
    )
    subscription = await this.newsletterService.createNewsletterSlot(
      user.id,
      'Pending Newsletter',
    )

    return { user, subscription }
  }

  /**
   * DEPRECATED: Legacy method for resolving user from email
   * Kept for backward compatibility with confirmation email flow
   */
  private async resolveUserFromEmail(
    recipientEmail: string,
  ): Promise<User | null> {
    const email = recipientEmail.toLowerCase()

    // Try new subscription-only alias format first
    const result = await this.resolveUserAndSubscription(email)
    if (result) {
      return result.user
    }

    // Fallback: try direct email lookup (for non-newsletter emails)
    return await this.userRepository.findOne({
      where: { email: recipientEmail },
    })
  }

  /**
   * Extract newsletter content using Readability
   */
  private async extractNewsletterContent(
    html?: string,
    text?: string,
  ): Promise<{ html: string; wordCount: number }> {
    if (!html && !text) {
      return { html: '<p>No content</p>', wordCount: 0 }
    }

    // If we have HTML, use Readability to extract the main content
    if (html) {
      try {
        const { document } = parseHTML(html)
        const reader = new Readability(document)
        const article = reader.parse()

        if (article?.content) {
          // Sanitize the HTML
          const sanitized = this.htmlSanitizer.sanitize(article.content)

          // Count words
          const wordCount = this.countWords(sanitized)

          return { html: sanitized, wordCount }
        }
      } catch (error) {
        this.logger.warn(`Readability extraction failed: ${error}`)
      }

      // Fallback: sanitize the full HTML
      const sanitized = this.htmlSanitizer.sanitize(html)

      return { html: sanitized, wordCount: this.countWords(sanitized) }
    }

    // Fallback: use plain text
    if (text) {
      const escapedText = this.escapeHtml(text)
      const wrappedHtml = `<pre>${escapedText}</pre>`

      return { html: wrappedHtml, wordCount: this.countWords(text) }
    }

    return { html: '<p>No content</p>', wordCount: 0 }
  }

  /**
   * Create library item from newsletter
   */
  private async createLibraryItem(data: {
    userId: string
    subscriptionId: string
    title: string
    content: string
    description?: string
    originalUrl: string
    author?: string
    publishedAt: Date
    wordCount: number
    siteName?: string
    siteIcon?: string
  }): Promise<LibraryItemEntity> {
    const contentHash = createHash('sha256').update(data.content).digest('hex')

    // Create library item entity directly (similar to RSS feed approach)
    const libraryItem = Object.assign(new LibraryItemEntity(), {
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      title: data.title,
      originalUrl: data.originalUrl,
      author: data.author,
      description: data.description,
      readableContent: data.content, // Content field is called readableContent
      publishedAt: data.publishedAt,
      savedAt: new Date(),
      state: LibraryItemState.SUCCEEDED,
      contentType: ContentType.ARTICLE,
      wordCount: data.wordCount,
      siteName: data.siteName,
      siteIcon: data.siteIcon,
      slug: this.generateSlug(data.title),
      contentHash,
    })

    return this.libraryItemRepository.save(libraryItem)
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    const timestamp = Date.now()
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)

    return `${slug}-${timestamp}`
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    // Strip HTML tags and count words
    const stripped = text.replace(/<[^>]*>/g, ' ')
    const words = stripped.match(/\b\w+\b/g)

    return words ? words.length : 0
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  /**
   * Handle forward-email jobs (placeholder)
   */
  private async handleForwardEmail(
    job: Job<SaveNewsletterJobData>,
  ): Promise<any> {
    this.logger.log(`Forward email job ${job.id} - not implemented yet`)

    return { success: true, message: 'Email forwarding not implemented' }
  }

  /**
   * Handle confirmation-email jobs
   * Creates pending confirmation record and forwards email to user's primary email
   */
  private async handleConfirmationEmail(
    job: Job<SaveNewsletterJobData>,
  ): Promise<any> {
    const { from, to, subject, html, text } = job.data

    try {
      // 1. Resolve user from recipient email
      const user = await this.resolveUserFromEmail(to)
      if (!user) {
        throw new Error(`Could not resolve user from email: ${to}`)
      }

      if (!user.email) {
        throw new Error(`User ${user.id} has no primary email address`)
      }

      // 2. Extract newsletter metadata
      const metadata = this.extractEmailMetadata(from, subject, html, text)
      this.logger.log(
        `Confirmation email from ${metadata.senderEmail}: "${subject}"`,
      )

      // 3. Detect newsletter platform
      const platform = this.detectNewsletterPlatform(metadata.senderEmail, html)

      // 4. Extract confirmation URL from HTML
      const confirmationUrl = this.extractConfirmationUrl(html)

      // 5. Create pending confirmation record
      const confirmation = await this.pendingConfirmationService.create({
        userId: user.id,
        newsletterSender: metadata.senderEmail,
        newsletterName: metadata.senderName || metadata.title || subject,
        newsletterPlatform: platform,
        confirmationEmailHtml: html || '',
        confirmationEmailText: text,
        confirmationUrl,
        forwardedTo: user.email,
        metadata: {
          originalHeaders: job.data.headers,
          detectedPlatformFrom:
            platform !== NewsletterPlatform.UNKNOWN ? 'domain' : 'manual',
        },
      })

      this.logger.log(
        `Created pending confirmation ${confirmation.id} for ${metadata.senderEmail}`,
      )

      // 6. Forward email to user's primary email
      await this.notificationQueue.add(
        JOB_TYPES.SEND_EMAIL,
        {
          userId: user.id,
          to: user.email,
          from: `Omnivore Newsletters <newsletters@omnivore.app>`,
          subject: `[Newsletter Confirmation] ${subject}`,
          html: this.wrapConfirmationEmail(
            html || text || '',
            metadata.senderName || metadata.senderEmail,
          ),
          text: text,
          replyTo: from,
        },
        {
          priority: JOB_PRIORITY.HIGH,
          attempts: 3,
        },
      )

      this.logger.log(
        `Forwarded confirmation email to ${user.email} for ${metadata.senderEmail}`,
      )

      return {
        success: true,
        confirmationId: confirmation.id,
        forwardedTo: user.email,
      }
    } catch (error) {
      this.logger.error(`Failed to process confirmation email: ${error}`)
      throw error
    }
  }

  /**
   * Detect newsletter platform from sender email and HTML content
   */
  private detectNewsletterPlatform(
    senderEmail: string,
    html?: string,
  ): NewsletterPlatform {
    const email = senderEmail.toLowerCase()

    // Detect by sender domain
    if (email.includes('@substack.com') || email.includes('substack')) {
      return NewsletterPlatform.SUBSTACK
    }
    if (email.includes('@beehiiv.com') || email.includes('beehiiv')) {
      return NewsletterPlatform.BEEHIIV
    }
    if (email.includes('mailchimp.com') || email.includes('list-manage.com')) {
      return NewsletterPlatform.MAILCHIMP
    }
    if (email.includes('convertkit.com')) {
      return NewsletterPlatform.CONVERTKIT
    }
    if (email.includes('@ghost.io') || email.includes('ghost')) {
      return NewsletterPlatform.GHOST
    }
    if (email.includes('buttondown.email')) {
      return NewsletterPlatform.BUTTONDOWN
    }
    if (email.includes('revue.email')) {
      return NewsletterPlatform.REVUE
    }

    // Try to detect from HTML content
    if (html) {
      const htmlLower = html.toLowerCase()
      if (htmlLower.includes('substackcdn.com')) {
        return NewsletterPlatform.SUBSTACK
      }
      if (htmlLower.includes('beehiiv.net')) {
        return NewsletterPlatform.BEEHIIV
      }
      if (htmlLower.includes('mailchimp')) {
        return NewsletterPlatform.MAILCHIMP
      }
      if (htmlLower.includes('convertkit')) {
        return NewsletterPlatform.CONVERTKIT
      }
    }

    return NewsletterPlatform.UNKNOWN
  }

  /**
   * Extract confirmation URL from HTML content
   */
  private extractConfirmationUrl(html?: string): string | undefined {
    if (!html) {
      return undefined
    }

    try {
      const { document } = parseHTML(html)

      // Look for links with confirmation-related text
      const confirmationPatterns = [
        /confirm/i,
        /verify/i,
        /activate/i,
        /subscribe/i,
      ]

      const links = document.querySelectorAll('a[href]')
      for (const link of Array.from(links)) {
        const href = link.getAttribute('href')
        const text = link.textContent?.trim() || ''

        if (
          href &&
          confirmationPatterns.some((p) => p.test(text) || p.test(href))
        ) {
          // Found a likely confirmation link
          return href
        }
      }

      // Fallback: look for any http/https link in the email
      const firstLink = links[0]
      if (firstLink) {
        const href = firstLink.getAttribute('href')
        if (
          href &&
          (href.startsWith('http://') || href.startsWith('https://'))
        ) {
          return href
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to extract confirmation URL: ${error}`)
    }

    return undefined
  }

  /**
   * Wrap confirmation email with helpful context for the user
   */
  private wrapConfirmationEmail(
    originalHtml: string,
    newsletterName: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <div style="background-color: #4CAF50; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0;">Newsletter Confirmation Required</h2>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">You've subscribed to <strong>${this.escapeHtml(
            newsletterName,
          )}</strong> using your Omnivore newsletter address.</p>
          <p style="font-size: 14px; color: #666;">To start receiving newsletters in your Omnivore library, please click the confirmation link below:</p>
          <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 4px;">
            ${originalHtml}
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <strong>Tip:</strong> After confirming, newsletters will automatically appear in your Omnivore library. You can manage your subscriptions in Settings.
          </p>
        </div>
      </div>
    `
  }

  /**
   * Handle save-attachment jobs (placeholder)
   */
  private async handleSaveAttachment(job: Job<any>): Promise<any> {
    this.logger.log(`Save attachment job ${job.id} - not implemented yet`)

    return { success: true, message: 'Attachment saving not implemented' }
  }

  /**
   * Worker event handlers
   */
  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job ${job.id} is now active`)
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error(`Job ${job?.id} failed: ${error.message}`)
  }
}

import { Module } from '@nestjs/common'

import { PostmarkEmailProvider } from './providers/postmark-email.provider'
import { EmailService } from './services/email.service'

/**
 * Notification module for sending emails across the application
 *
 * Services provided:
 * - EmailService: High-level email sending service
 * - PostmarkEmailProvider: Postmark-specific implementation
 *
 * Usage in other modules:
 * @Module({
 *   imports: [NotificationModule],
 * })
 * export class YourModule {}
 *
 * Then inject EmailService:
 * constructor(private readonly emailService: EmailService) {}
 */
@Module({
  providers: [EmailService, PostmarkEmailProvider],
  exports: [EmailService],
})
export class NotificationModule {}

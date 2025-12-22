import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { NewsletterPlatform as NewsletterPlatformEnum } from '../entities/pending-confirmation.entity'

// Register NewsletterPlatform enum for GraphQL
registerEnumType(NewsletterPlatformEnum, {
  name: 'NewsletterPlatform',
  description: 'Newsletter platform provider',
})

@ObjectType()
export class PendingConfirmation {
  @Field(() => ID)
  id: string

  @Field()
  userId: string

  @Field({ description: 'Sender email address of the newsletter' })
  newsletterSender: string

  @Field({ description: 'Name of the newsletter' })
  newsletterName: string

  @Field(() => NewsletterPlatformEnum, {
    nullable: true,
    description: 'Detected newsletter platform',
  })
  newsletterPlatform?: NewsletterPlatformEnum

  @Field({ description: 'HTML content of the confirmation email' })
  confirmationEmailHtml: string

  @Field({
    nullable: true,
    description: 'Plain text of the confirmation email',
  })
  confirmationEmailText?: string

  @Field({ nullable: true, description: 'Extracted confirmation URL' })
  confirmationUrl?: string

  @Field({ description: 'Email address where confirmation was forwarded' })
  forwardedTo: string

  @Field(() => Int, {
    description: 'Number of times confirmation was forwarded',
  })
  forwardAttempts: number

  @Field({ description: 'Last time confirmation was forwarded' })
  lastForwardedAt: Date

  @Field(() => [String], {
    nullable: true,
    description: 'History of email addresses confirmation was forwarded to',
  })
  forwardedToEmails?: string[]

  @Field({ description: 'Whether confirmation has been completed' })
  confirmed: boolean

  @Field({ nullable: true, description: 'When confirmation was completed' })
  confirmedAt?: Date

  @Field({ description: 'Whether confirmation has expired' })
  expired: boolean

  @Field({ description: 'When confirmation expires' })
  expiresAt: Date

  @Field({ description: 'Whether user dismissed this confirmation' })
  userDismissed: boolean

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Additional metadata for debugging',
  })
  metadata?: Record<string, any>

  @Field({ description: 'When confirmation was created' })
  createdAt: Date

  @Field({ description: 'When confirmation was last updated' })
  updatedAt: Date

  // Computed fields
  @Field({ description: 'Whether confirmation is still pending' })
  isPending: boolean

  @Field(() => Int, { description: 'Hours since confirmation was created' })
  durationPendingHours: number

  @Field({ description: 'Whether reminder should be sent (>48 hours)' })
  shouldSendReminder: boolean

  @Field({ description: 'Whether confirmation is expiring soon (<24 hours)' })
  isExpiringSoon: boolean
}

@ObjectType()
export class PendingConfirmationResult {
  @Field()
  success: boolean

  @Field(() => [String], { nullable: true })
  errors?: string[]

  @Field(() => String, { nullable: true })
  message?: string

  @Field(() => PendingConfirmation, { nullable: true })
  confirmation?: PendingConfirmation
}

@ObjectType()
export class PlatformAnalytics {
  @Field(() => Int)
  total: number

  @Field(() => Int)
  confirmed: number

  @Field()
  conversionRate: number
}

@ObjectType()
export class PendingConfirmationAnalytics {
  @Field(() => Int, { description: 'Total confirmations' })
  total: number

  @Field(() => Int, { description: 'Confirmed count' })
  confirmed: number

  @Field(() => Int, { description: 'Expired count' })
  expired: number

  @Field(() => Int, { description: 'Pending count' })
  pending: number

  @Field(() => Int, { description: 'Dismissed count' })
  dismissed: number

  @Field({ description: 'Conversion rate (confirmed / total)' })
  conversionRate: number

  @Field({ description: 'Average time to confirm in milliseconds' })
  avgTimeToConfirm: number

  @Field(() => GraphQLJSON, {
    description: 'Analytics broken down by platform',
  })
  byPlatform: Record<string, PlatformAnalytics>
}

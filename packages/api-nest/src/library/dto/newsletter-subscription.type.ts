import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql'
import { IsArray, IsOptional, IsString } from 'class-validator'

/**
 * Newsletter Subscription GraphQL type
 * Represents a user's subscription to a newsletter via email
 */
@ObjectType()
export class NewsletterSubscription {
  @Field(() => ID)
  id!: string

  @Field()
  userId!: string

  @Field({
    description: 'Sender email address (e.g., writer@substack.com)',
  })
  senderEmail!: string

  @Field({
    description:
      'Unique email alias for routing (e.g., "a7x9k2" in user+a7x9k2@omnivore.app)',
  })
  emailAlias!: string

  @Field({
    nullable: true,
    description:
      'Full newsletter email address for this specific subscription (e.g., userAlias+subscriptionAlias@inbox.omnivore.app)',
  })
  newsletterEmail?: string | null

  @Field({ nullable: true })
  title?: string | null

  @Field({ nullable: true })
  description?: string | null

  @Field({ nullable: true })
  siteUrl?: string | null

  @Field({ nullable: true })
  siteIcon?: string | null

  @Field(() => Date, { nullable: true, description: 'Last email received' })
  lastReceivedAt?: Date | null

  @Field(() => Int, { description: 'Total newsletters imported' })
  itemCount!: number

  @Field(() => Int, {
    nullable: true,
    description: 'Number of unread newsletters (computed via field resolver)',
  })
  unreadCount?: number | null

  @Field()
  active!: boolean

  @Field({
    nullable: true,
    description: 'Folder to auto-route newsletters to',
  })
  folder?: string | null

  @Field(() => [String], {
    nullable: true,
    description: 'Labels to auto-apply to newsletters',
  })
  autoAddLabels?: string[] | null

  @Field({ nullable: true, description: 'Unsubscribe email address' })
  unsubscribeMailTo?: string | null

  @Field({ nullable: true, description: 'Unsubscribe HTTP URL' })
  unsubscribeHttpUrl?: string | null

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  updatedAt!: Date
}

/**
 * Input type for updating newsletter subscription settings
 */
@InputType()
export class UpdateNewsletterSubscriptionInput {
  @Field({ nullable: true, description: 'Newsletter title override' })
  @IsOptional()
  @IsString()
  title?: string

  @Field({
    nullable: true,
    description: 'Folder to auto-route newsletters to',
  })
  @IsOptional()
  @IsString()
  folder?: string

  @Field(() => [String], {
    nullable: true,
    description: 'Labels to auto-apply to newsletters',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  autoAddLabels?: string[]
}

/**
 * Result type for newsletter subscription operations
 */
@ObjectType()
export class NewsletterSubscriptionResult {
  @Field()
  success!: boolean

  @Field({ nullable: true })
  message?: string | null

  @Field(() => NewsletterSubscription, { nullable: true })
  subscription?: NewsletterSubscription | null

  @Field(() => [String], { nullable: true })
  errors?: string[] | null
}

/**
 * Result type for getting user's newsletter email address
 */
@ObjectType()
export class NewsletterEmailResult {
  @Field({
    description:
      'Full newsletter email address (e.g., user+a7x9k2@omnivore.app)',
  })
  newsletterEmail!: string

  @Field({
    description: 'User email alias (e.g., a7x9k2)',
  })
  emailAlias!: string
}

import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql'

/**
 * RSS Feed GraphQL type
 */
@ObjectType()
export class RssFeed {
  @Field(() => ID)
  id!: string

  @Field()
  userId!: string

  @Field()
  feedUrl!: string

  @Field({ nullable: true })
  title?: string | null

  @Field({ nullable: true })
  description?: string | null

  @Field({ nullable: true })
  siteUrl?: string | null

  @Field({ nullable: true })
  siteIcon?: string | null

  @Field(() => Date, { nullable: true })
  lastFetchedAt?: Date | null

  @Field(() => Int)
  itemCount!: number

  @Field(() => Int, {
    nullable: true,
    description: 'Number of unread feed items (computed via field resolver)',
  })
  unreadCount?: number | null

  @Field()
  active!: boolean

  @Field({ nullable: true })
  lastError?: string | null

  @Field(() => Int)
  failureCount!: number

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  updatedAt!: Date
}

/**
 * Input type for updating RSS feed settings
 */
@InputType()
export class UpdateRssFeedSettingsInput {
  @Field({ nullable: true, description: 'Feed title override' })
  title?: string

  @Field({ nullable: true, description: 'Whether to auto-add new items to library' })
  autoAddToLibrary?: boolean

  @Field({ nullable: true, description: 'Default folder for new items' })
  folder?: string
}

/**
 * Result type for RSS feed operations
 */
@ObjectType()
export class RssFeedResult {
  @Field()
  success!: boolean

  @Field({ nullable: true })
  message?: string | null

  @Field(() => RssFeed, { nullable: true })
  feed?: RssFeed | null

  @Field(() => [String], { nullable: true })
  errors?: string[] | null
}

/**
 * Result type for bulk RSS operations
 */
@ObjectType()
export class RssFeedBulkResult {
  @Field()
  success!: boolean

  @Field(() => Int)
  successCount!: number

  @Field(() => Int)
  failureCount!: number

  @Field(() => [String], { nullable: true })
  errors?: string[] | null

  @Field({ nullable: true })
  message?: string | null
}

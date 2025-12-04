import {
  Field,
  GraphQLISODateTime,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  // OneToOne, // Reserved for future use
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { UserRole } from '../enums/user-role.enum'

export enum StatusType {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED',
}

export enum RegistrationType {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  TWITTER = 'TWITTER',
  APPLE = 'APPLE',
}

registerEnumType(StatusType, {
  name: 'StatusType',
})

registerEnumType(RegistrationType, {
  name: 'RegistrationType',
})

@ObjectType()
@Entity({ name: 'user', schema: 'omnivore' })
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string

  // Existing columns from migration 0001 + subsequent migrations
  @Column('text', { name: 'first_name', nullable: true })
  firstName?: string

  @Column('text', { name: 'last_name', nullable: true })
  lastName?: string

  @Field(() => RegistrationType)
  @Column({ type: 'enum', enum: RegistrationType })
  source!: RegistrationType

  @Index('idx_user_email') // Add index for faster login lookups
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'email', nullable: true })
  email?: string

  /**
   * Unique email alias for newsletter routing
   * Example: "a7x9k2m1" becomes a7x9k2m1@inbox.omnivore.app
   * or a7x9k2m1+subscription-id@inbox.omnivore.app for specific subscriptions
   * Part of ARC-016 (Newsletter Subscriptions)
   */
  @Field(() => String, { nullable: true })
  @Column('varchar', {
    name: 'email_alias',
    length: 64,
    unique: true,
    nullable: true,
  })
  emailAlias?: string

  @Column('text', { nullable: true })
  phone?: string

  @Column('text', { name: 'source_user_id', unique: true })
  sourceUserId!: string

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'name', nullable: true })
  name?: string

  @Column('varchar', { length: 255, name: 'password', nullable: true }) // Added in migration 0067
  password?: string

  @Field(() => StatusType)
  @Column({
    type: 'enum',
    enum: StatusType,
    default: StatusType.ACTIVE,
    name: 'status',
  }) // Added in migration 0088
  status!: StatusType

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn({ name: 'updated_at' }) // Added in migration 0014
  updatedAt!: Date

  // NEW: Enhanced role system - will be added via new migration
  @Field(() => UserRole, { nullable: true })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    nullable: true, // Make nullable initially for existing records
    name: 'role',
  })
  role?: UserRole

  // TODO: Enable when Profile table is properly set up
  // @OneToOne(() => Profile, (profile) => profile.user, {
  //   eager: true,
  //   cascade: true,
  // })
  // profile!: Profile

  // Helper methods
  hasRole(role: UserRole): boolean {
    return this.role === role
  }

  isActive(): boolean {
    return this.status === StatusType.ACTIVE
  }

  isSuspended(): boolean {
    return this.role === UserRole.SUSPENDED
  }

  isPending(): boolean {
    return this.status === StatusType.PENDING
  }

  canAccess(): boolean {
    return this.isActive() && !this.isSuspended() && !this.isPending()
  }

  /**
   * Get the user's newsletter email address
   * Format: {emailAlias}@inbox.omnivore.app
   * Returns null if emailAlias is not set
   */
  @Field(() => String, {
    nullable: true,
    description:
      'Newsletter email address for receiving newsletter subscriptions',
  })
  get newsletterEmail(): string | null {
    if (!this.emailAlias) {
      return null
    }
    // TODO: Make domain configurable via environment variable
    return `${this.emailAlias}@inbox.omnivore.app`
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserProfile } from './entities/profile.entity'
import { RegistrationType, StatusType, User } from './entities/user.entity'
import { hasPermission, Permission, UserRole } from './enums/user-role.enum'

// Import RegisterDto from auth module
export interface RegisterDto {
  email: string
  name: string
  password: string
  inviteCode?: string
}

export interface RegisterUserInput {
  email: string
  name: string
  passwordHash?: string
  username?: string
  bio?: string
  pictureUrl?: string
  requireEmailConfirmation?: boolean
  inviteCode?: string
  sourceUserId?: string
  registrationType?: RegistrationType
}

export interface RegisterUserResult {
  user: User
  profile: UserProfile
}

export interface CompleteRegistrationResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
  accessToken?: string
  expiresIn?: string
  pendingEmailVerification?: boolean
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new user with profile in a transaction
   * This is a low-level method called by registration services
   * @internal - Should only be called by UserRegistrationService
   */
  async createUserWithProfile(
    input: RegisterUserInput,
  ): Promise<RegisterUserResult> {
    const {
      email,
      name,
      username,
      bio,
      pictureUrl,
      passwordHash,
      requireEmailConfirmation,
    } = input
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedUsername = (username ?? this.generateUsername(name))
      .trim()
      .toLowerCase()

    // Handle invite validation if invite code provided
    if (input.inviteCode) {
      // TODO: Implement full invite validation and group membership creation
      // STUB - needs full InviteValidationService integration
      // In the full implementation, this would:
      // 1. Validate the invite code (expiration, max members)
      // 2. Create a GroupMembership record
      // 3. Associate the user with the group
    }

    const status = requireEmailConfirmation
      ? StatusType.PENDING
      : StatusType.ACTIVE

    // Determine registration source and sourceUserId
    const source = input.registrationType || RegistrationType.EMAIL
    const sourceUserId =
      input.sourceUserId || `email-${normalizedEmail}-${Date.now()}`

    // Create and save user
    const newUser = this.userRepository.create({
      email: normalizedEmail,
      name: name.trim(),
      password: passwordHash,
      source,
      sourceUserId,
      status,
    })

    const savedUser = await this.userRepository.save(newUser)

    // Create and save profile
    const newProfile = this.profileRepository.create({
      username: normalizedUsername,
      bio: bio ?? null,
      pictureUrl: pictureUrl ?? null,
      private: false,
      user: savedUser,
    })

    const savedProfile = await this.profileRepository.save(newProfile)

    return { user: savedUser, profile: savedProfile }
  }

  /**
   * Activate a pending user (used for email confirmation)
   */
  async activateUser(userId: string): Promise<User> {
    await this.userRepository.update(
      { id: userId },
      { status: StatusType.ACTIVE },
    )

    const result = await this.userRepository.findOne({ where: { id: userId } })

    if (!result) {
      throw new NotFoundException('User not found')
    }

    return result
  }

  private generateUsername(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20)

    const suffix = Math.floor(Math.random() * 10000)

    return base.length > 0 ? `${base}${suffix}` : `user${suffix}`
  }

  /**
   * Create a new user with profile (legacy method - consider deprecating)
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email)
    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    // Create user (password should be pre-hashed if provided)
    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password ?? null,
      source: RegistrationType.EMAIL,
      sourceUserId: `${RegistrationType.EMAIL}-${
        createUserDto.email
      }-${Date.now()}`,
      role: createUserDto.role ?? UserRole.USER,
      status: StatusType.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return this.userRepository.save(user)
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    })

    return user || null
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    })

    return user || null
  }

  /**
   * Find a user by their email address and registration source.
   * @param email The user's email address.
   * @param source The registration source (GOOGLE, APPLE, EMAIL).
   * @returns The user if found, otherwise null.
   */
  async findByEmailAndSource(
    email: string,
    source: RegistrationType,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, source },
    })

    return user || null
  }

  /**
   * Update user information
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Update user fields
    // Update fields (password should be pre-hashed if provided)
    Object.assign(user, updateUserDto)

    await this.userRepository.save(user)

    // Update profile if provided
    // if (updateUserDto.profile) {
    //   await this.profileRepository.update({ userId: id }, updateUserDto.profile)
    // }

    return this.findById(id)!
  }

  /**
   * Update user role
   */
  async updateRole(
    id: string,
    role: UserRole,
    _reason?: string,
  ): Promise<User> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    user.role = role
    await this.userRepository.save(user)

    return user
  }

  /**
   * Suspend user
   */
  async suspend(id: string, reason?: string): Promise<User> {
    return this.updateRole(id, UserRole.SUSPENDED, reason)
  }

  /**
   * Reactivate suspended user
   */
  async reactivate(id: string): Promise<User> {
    return this.updateRole(id, UserRole.USER)
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    permission: Permission,
  ): Promise<boolean> {
    const user = await this.findById(userId)
    if (!user || !user.canAccess()) {
      return false
    }

    return hasPermission(user.role, permission)
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
    })
  }

  /**
   * Get user statistics
   */
  async getStats() {
    const total = await this.userRepository.count()
    const active = await this.userRepository.count({
      where: { status: StatusType.ACTIVE },
    })
    const suspended = await this.userRepository.count({
      where: { role: UserRole.SUSPENDED },
    })
    const premium = await this.userRepository.count({
      where: { role: UserRole.PREMIUM },
    })

    return { total, active, suspended, premium }
  }

  /**
   * Update a user's password hash
   * @internal - Should only be called by PasswordService
   * @param userId - User ID
   * @param passwordHash - Hashed password
   */
  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.userRepository.update({ id: userId }, { password: passwordHash })
  }
}

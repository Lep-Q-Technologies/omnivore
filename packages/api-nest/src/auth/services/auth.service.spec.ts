/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { DataSource } from 'typeorm'

import { AnalyticsService } from '../../analytics/analytics.service'
import { IntercomService } from '../../integrations/intercom.service'
import { StructuredLogger } from '../../logging/structured-logger.service'
import { PubSubService } from '../../pubsub/pubsub.service'
import { UserProfile } from '../../user/entities/profile.entity'
import {
  RegistrationType,
  StatusType,
  User,
} from '../../user/entities/user.entity'
import { UserRole } from '../../user/enums/user-role.enum'
import { UserService } from '../../user/user.service'
import { DefaultUserResourcesService } from '../default-user-resources.service'
import { RegisterDto } from '../dto/register.dto'
import { EmailVerificationService } from '../email-verification.service'
import { NotificationClient } from '../interfaces/notification-client.interface'
import { AuthService } from './auth.service'
import { PasswordService } from './password.service'
import { UserRegistrationService } from './user-registration.service'

// eslint-disable-next-line @typescript-eslint/consistent-return
const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: '1',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    email: 'test@example.com',
    source: RegistrationType.EMAIL,
    sourceUserId: 'email-test-123',
    password: 'hashed-password',
    status: StatusType.ACTIVE,
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    canAccess: () => true,
    isPending: () => false,
    ...overrides,
  }) as User

describe('AuthService', () => {
  let service: AuthService = null
  let jwtService: JwtService = null
  let userService: UserService = null
  let emailVerificationService: EmailVerificationService = null
  let defaultResourcesService: DefaultUserResourcesService = null
  let notificationClient: NotificationClient = null

  const mockJwtService = {
    sign: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn(),
  }

  const mockUserService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    activateUser: jest.fn(),
  }

  const mockPasswordService = {
    validatePassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  }

  const mockUserRegistrationService = {
    registerUser: jest.fn(),
    resendVerification: jest.fn(),
  }

  const mockEmailVerificationService = {
    createVerificationToken: jest.fn(),
    verifyToken: jest.fn(),
  }

  const mockDefaultResourcesService = {
    provisionForUser: jest.fn(),
  }

  const mockNotificationClient = {
    sendEmailVerification: jest.fn(),
  }

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
      },
    }),
    getRepository: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: UserRegistrationService,
          useValue: mockUserRegistrationService,
        },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
        {
          provide: DefaultUserResourcesService,
          useValue: mockDefaultResourcesService,
        },
        {
          provide: NotificationClient,
          useValue: mockNotificationClient,
        },
        {
          provide: AnalyticsService,
          useValue: {
            trackUserLogin: jest.fn(),
            trackUserCreated: jest.fn(),
            trackEmailVerified: jest.fn(),
          },
        },
        {
          provide: PubSubService,
          useValue: {
            userCreated: jest.fn(),
          },
        },
        {
          provide: IntercomService,
          useValue: {
            createUserContact: jest.fn(),
          },
        },
        {
          provide: StructuredLogger,
          useValue: {
            setContext: jest.fn(),
            withContext: jest.fn().mockReturnValue({
              log: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
            }),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jwtService = module.get<JwtService>(JwtService)
    userService = module.get<UserService>(UserService)
    emailVerificationService = module.get<EmailVerificationService>(
      EmailVerificationService,
    )
    defaultResourcesService = module.get<DefaultUserResourcesService>(
      DefaultUserResourcesService,
    )
    notificationClient = module.get<NotificationClient>(NotificationClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = createMockUser()

      mockUserService.findByEmail.mockResolvedValue(mockUser)
      mockPasswordService.validatePassword.mockResolvedValue(true)

      const result = await service.validateUser('test@example.com', 'password')

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockPasswordService.validatePassword).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      )
      expect(result).toEqual(mockUser)
    })

    it('should return null when user is not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null)

      const result = await service.validateUser('test@example.com', 'password')

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockPasswordService.validatePassword).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return null when password is invalid', async () => {
      const mockUser = createMockUser()

      mockUserService.findByEmail.mockResolvedValue(mockUser)
      mockPasswordService.validatePassword.mockResolvedValue(false)

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      )

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockPasswordService.validatePassword).toHaveBeenCalledWith(
        'wrongpassword',
        'hashed-password',
      )
      expect(result).toBeNull()
    })

    it('should return null when user has no password', async () => {
      const mockUser = createMockUser({ password: null })

      mockUserService.findByEmail.mockResolvedValue(mockUser)

      const result = await service.validateUser('test@example.com', 'password')

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockPasswordService.validatePassword).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return null when user cannot access', async () => {
      const mockUser = createMockUser({ canAccess: () => false })

      mockUserService.findByEmail.mockResolvedValue(mockUser)
      mockPasswordService.validatePassword.mockResolvedValue(true)

      const result = await service.validateUser('test@example.com', 'password')

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockPasswordService.validatePassword).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      )
      expect(result).toBeNull()
    })
  })

  describe('login', () => {
    it('should return login result with JWT token', async () => {
      const mockUser = createMockUser()
      const mockToken = 'jwt-token'

      mockJwtService.sign.mockReturnValue(mockToken)
      mockConfigService.get.mockReturnValue('1h')

      const result = await service.login(mockUser)

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      })
      expect(result).toEqual({
        success: true,
        accessToken: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      })
    })
  })

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'password123',
    }

    it('should register user and return login result when email confirmation not required', async () => {
      const mockUser = createMockUser({
        email: 'newuser@example.com',
        name: 'New User',
      })
      const mockLoginResult = {
        success: true,
        accessToken: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      }

      mockUserRegistrationService.registerUser.mockResolvedValue({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        pendingEmailVerification: false,
      })
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') {
          return '1h'
        }

        return null
      })
      mockUserService.findById.mockResolvedValue(mockUser)
      mockJwtService.sign.mockReturnValue('jwt-token')

      const result = await service.register(registerDto)

      expect(mockUserRegistrationService.registerUser).toHaveBeenCalledWith({
        email: registerDto.email,
        name: registerDto.name,
        password: registerDto.password,
      })
      expect(userService.findById).toHaveBeenCalledWith(mockUser.id)
      expect(result).toEqual(mockLoginResult)
    })

    it('should register user and return pending verification when email confirmation required', async () => {
      mockUserRegistrationService.registerUser.mockResolvedValue({
        user: {
          id: '1',
          email: 'newuser@example.com',
          name: 'New User',
        },
        pendingEmailVerification: true,
      })

      const result = await service.register(registerDto)

      expect(mockUserRegistrationService.registerUser).toHaveBeenCalledWith({
        email: registerDto.email,
        name: registerDto.name,
        password: registerDto.password,
      })
      expect(result).toEqual({
        success: true,
        message:
          'Registration successful. Please check your email for verification.',
        redirectUrl: '/auth/email-login',
        pendingEmailVerification: true,
      })
    })
  })

  describe('confirmEmail', () => {
    it('should activate pending user and return login result', async () => {
      const mockPayload = {
        userId: '1',
        email: 'test@example.com',
      }
      const mockUser = createMockUser({ status: StatusType.PENDING })
      const mockActivatedUser = createMockUser({ status: StatusType.ACTIVE })
      const mockLoginResult = {
        success: true,
        accessToken: 'jwt-token',
        user: {
          id: mockActivatedUser.id,
          email: mockActivatedUser.email,
          name: mockActivatedUser.name,
        },
      }

      mockEmailVerificationService.verifyToken.mockResolvedValue(mockPayload)
      mockUserService.findById.mockResolvedValue(mockUser)
      mockUserService.activateUser.mockResolvedValue(mockActivatedUser)
      mockJwtService.sign.mockReturnValue('jwt-token')
      mockConfigService.get.mockReturnValue('1h')

      const result = await service.confirmEmail('verification-token')

      expect(emailVerificationService.verifyToken).toHaveBeenCalledWith(
        'verification-token',
        {
          consume: true,
        },
      )
      expect(userService.findById).toHaveBeenCalledWith('1')
      expect(userService.activateUser).toHaveBeenCalledWith('1')
      expect(result).toEqual(mockLoginResult)
    })

    it('should return login result for already active user', async () => {
      const mockPayload = {
        userId: '1',
        email: 'test@example.com',
      }
      const mockUser = createMockUser({ status: StatusType.ACTIVE })
      const mockLoginResult = {
        success: true,
        accessToken: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      }

      mockEmailVerificationService.verifyToken.mockResolvedValue(mockPayload)
      mockUserService.findById.mockResolvedValue(mockUser)
      mockJwtService.sign.mockReturnValue('jwt-token')
      mockConfigService.get.mockReturnValue('1h')

      const result = await service.confirmEmail('verification-token')

      expect(emailVerificationService.verifyToken).toHaveBeenCalledWith(
        'verification-token',
        {
          consume: true,
        },
      )
      expect(userService.findById).toHaveBeenCalledWith('1')
      expect(userService.activateUser).not.toHaveBeenCalled()
      expect(result).toEqual(mockLoginResult)
    })

    it('should throw error when user not found', async () => {
      const mockPayload = {
        userId: '1',
        email: 'test@example.com',
      }

      mockEmailVerificationService.verifyToken.mockResolvedValue(mockPayload)
      mockUserService.findById.mockResolvedValue(null)

      await expect(service.confirmEmail('verification-token')).rejects.toThrow(
        'User not found',
      )

      expect(emailVerificationService.verifyToken).toHaveBeenCalledWith(
        'verification-token',
        {
          consume: true,
        },
      )
      expect(userService.findById).toHaveBeenCalledWith('1')
    })
  })

  describe('refreshToken', () => {
    it('should return new JWT token', async () => {
      const mockUser = createMockUser()
      const mockToken = 'new-jwt-token'

      mockJwtService.sign.mockReturnValue(mockToken)

      const result = await service.refreshToken(mockUser)

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      })
      expect(result).toEqual({
        success: true,
        accessToken: mockToken,
      })
    })
  })

  describe('resendVerification', () => {
    it('should send verification email for pending user', async () => {
      mockUserRegistrationService.resendVerification.mockResolvedValue(null)

      const result = await service.resendVerification('test@example.com')

      expect(
        mockUserRegistrationService.resendVerification,
      ).toHaveBeenCalledWith('test@example.com')
      expect(result).toEqual({
        success: true,
        message: 'Verification email sent',
      })
    })

    it('should throw error when user not found', async () => {
      mockUserRegistrationService.resendVerification.mockRejectedValue(
        new Error('User not found'),
      )

      await expect(
        service.resendVerification('test@example.com'),
      ).rejects.toThrow('User not found')

      expect(
        mockUserRegistrationService.resendVerification,
      ).toHaveBeenCalledWith('test@example.com')
    })

    it('should throw error when user is already verified', async () => {
      mockUserRegistrationService.resendVerification.mockRejectedValue(
        new Error('Email already verified'),
      )

      await expect(
        service.resendVerification('test@example.com'),
      ).rejects.toThrow('Email already verified')

      expect(
        mockUserRegistrationService.resendVerification,
      ).toHaveBeenCalledWith('test@example.com')
    })
  })
})

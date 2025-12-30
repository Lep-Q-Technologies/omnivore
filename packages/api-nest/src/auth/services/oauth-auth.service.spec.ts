import { Test, TestingModule } from '@nestjs/testing'

import { UserProfile } from '../../user/entities/profile.entity'
import {
  RegistrationType,
  StatusType,
  User,
} from '../../user/entities/user.entity'
import { UserRole } from '../../user/enums/user-role.enum'
import { UserService } from '../../user/user.service'
import { AuthService } from './auth.service'
import { GoogleOAuthService } from './google-oauth.service'
import { OAuthAuthService } from './oauth-auth.service'

const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-123',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    email: 'test@example.com',
    source: RegistrationType.GOOGLE,
    sourceUserId: 'google-123',
    status: StatusType.ACTIVE,
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    canAccess: () => true,
    isPending: () => false,
    ...overrides,
  }) as User

// Standard login response structure (simplified)
const createMockLoginResponse = (user: User, token: string) => ({
  success: true as const,
  accessToken: token,
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
  },
})

describe('OAuthAuthService', () => {
  let service: OAuthAuthService
  let userService: UserService
  let authService: AuthService
  let googleOAuthService: GoogleOAuthService

  const mockUserService = {
    findByEmailAndSource: jest.fn(),
    createUserWithProfile: jest.fn(),
  }

  const mockAuthService = {
    login: jest.fn(),
  }

  const mockGoogleOAuthService = {
    verifyWebToken: jest.fn(),
    decodeGoogleToken: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthAuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: GoogleOAuthService,
          useValue: mockGoogleOAuthService,
        },
      ],
    }).compile()

    service = module.get<OAuthAuthService>(OAuthAuthService)
    userService = module.get<UserService>(UserService)
    authService = module.get<AuthService>(AuthService)
    googleOAuthService = module.get<GoogleOAuthService>(GoogleOAuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('handleGoogleAuth (unified flow)', () => {
    describe('web authentication', () => {
      it('should return unified response with token and user for existing user', async () => {
        const mockUser = createMockUser()
        const mockResponse = createMockLoginResponse(
          mockUser,
          'jwt-access-token',
        )

        mockGoogleOAuthService.verifyWebToken.mockResolvedValue({
          email: 'test@example.com',
          sourceUserId: 'google-123',
          name: 'Test User',
        })
        mockUserService.findByEmailAndSource.mockResolvedValue(mockUser)
        mockAuthService.login.mockResolvedValue(mockResponse)

        const result = await service.handleGoogleAuth('valid-id-token')

        expect(result).toEqual(mockResponse)
        expect(googleOAuthService.verifyWebToken).toHaveBeenCalledWith(
          'valid-id-token',
        )
        expect(userService.findByEmailAndSource).toHaveBeenCalledWith(
          'test@example.com',
          RegistrationType.GOOGLE,
        )
        expect(authService.login).toHaveBeenCalledWith(mockUser)
      })

      it('should create new user and return unified response for first-time auth', async () => {
        const mockUser = createMockUser({ email: 'new@example.com' })
        const mockResponse = createMockLoginResponse(
          mockUser,
          'jwt-access-token',
        )

        mockGoogleOAuthService.verifyWebToken.mockResolvedValue({
          email: 'new@example.com',
          sourceUserId: 'google-new-123',
          name: 'New User',
          pictureUrl: 'https://example.com/pic.jpg',
        })
        mockUserService.findByEmailAndSource.mockResolvedValue(null)
        mockUserService.createUserWithProfile.mockResolvedValue({
          user: mockUser,
          profile: { username: 'test' } as UserProfile,
        })
        mockAuthService.login.mockResolvedValue(mockResponse)

        const result = await service.handleGoogleAuth('valid-id-token')

        expect(result).toEqual(mockResponse)
        expect(userService.createUserWithProfile).toHaveBeenCalledWith({
          email: 'new@example.com',
          name: 'New User',
          sourceUserId: 'google-new-123',
          registrationType: RegistrationType.GOOGLE,
          requireEmailConfirmation: false,
          pictureUrl: 'https://example.com/pic.jpg',
        })
      })

      it('should return failure when token is invalid', async () => {
        mockGoogleOAuthService.verifyWebToken.mockResolvedValue(null)

        const result = await service.handleGoogleAuth('invalid-token')

        expect(result).toEqual({ success: false })
      })

      it('should return failure when user cannot access system', async () => {
        const mockUser = createMockUser({ canAccess: () => false })

        mockGoogleOAuthService.verifyWebToken.mockResolvedValue({
          email: 'test@example.com',
          sourceUserId: 'google-123',
        })
        mockUserService.findByEmailAndSource.mockResolvedValue(mockUser)

        const result = await service.handleGoogleAuth('valid-id-token')

        expect(result).toEqual({ success: false })
        expect(authService.login).not.toHaveBeenCalled()
      })
    })

    describe('mobile authentication', () => {
      it('should return unified response for existing user (iOS)', async () => {
        const mockUser = createMockUser()
        const mockResponse = createMockLoginResponse(
          mockUser,
          'jwt-mobile-token',
        )

        mockGoogleOAuthService.decodeGoogleToken.mockResolvedValue({
          email: 'test@example.com',
          sourceUserId: 'google-123',
          name: 'Test User',
        })
        mockUserService.findByEmailAndSource.mockResolvedValue(mockUser)
        mockAuthService.login.mockResolvedValue(mockResponse)

        const result = await service.handleGoogleAuth('id-token', false)

        expect(result).toEqual(mockResponse)
        expect(googleOAuthService.decodeGoogleToken).toHaveBeenCalledWith(
          'id-token',
          false,
        )
        expect(authService.login).toHaveBeenCalledWith(mockUser)
      })

      it('should return unified response for existing user (Android)', async () => {
        const mockUser = createMockUser()
        const mockResponse = createMockLoginResponse(
          mockUser,
          'jwt-android-token',
        )

        mockGoogleOAuthService.decodeGoogleToken.mockResolvedValue({
          email: 'test@example.com',
          sourceUserId: 'google-123',
        })
        mockUserService.findByEmailAndSource.mockResolvedValue(mockUser)
        mockAuthService.login.mockResolvedValue(mockResponse)

        const result = await service.handleGoogleAuth('id-token', true)

        expect(result).toEqual(mockResponse)
        expect(googleOAuthService.decodeGoogleToken).toHaveBeenCalledWith(
          'id-token',
          true,
        )
      })

      it('should auto-create user on first mobile login', async () => {
        const mockUser = createMockUser({
          email: 'new@example.com',
          name: 'New Mobile User',
        })
        const mockResponse = createMockLoginResponse(mockUser, 'jwt-token')

        mockGoogleOAuthService.decodeGoogleToken.mockResolvedValue({
          email: 'new@example.com',
          sourceUserId: 'google-new-123',
          name: 'New Mobile User',
        })
        mockUserService.findByEmailAndSource.mockResolvedValue(null)
        mockUserService.createUserWithProfile.mockResolvedValue({
          user: mockUser,
          profile: { username: 'test' } as UserProfile,
        })
        mockAuthService.login.mockResolvedValue(mockResponse)

        const result = await service.handleGoogleAuth('id-token', true)

        expect(result).toEqual(mockResponse)
        expect(userService.createUserWithProfile).toHaveBeenCalledWith({
          email: 'new@example.com',
          name: 'New Mobile User',
          sourceUserId: 'google-new-123',
          registrationType: RegistrationType.GOOGLE,
          requireEmailConfirmation: false,
        })
      })

      it('should return failure when mobile token has error', async () => {
        mockGoogleOAuthService.decodeGoogleToken.mockResolvedValue({
          errorCode: 401,
        })

        const result = await service.handleGoogleAuth('bad-token', false)

        expect(result).toEqual({ success: false })
      })

      it('should return failure when user cannot access (mobile)', async () => {
        const mockUser = createMockUser({ canAccess: () => false })

        mockGoogleOAuthService.decodeGoogleToken.mockResolvedValue({
          email: 'test@example.com',
          sourceUserId: 'google-123',
        })
        mockUserService.findByEmailAndSource.mockResolvedValue(mockUser)

        const result = await service.handleGoogleAuth('id-token', false)

        expect(result).toEqual({ success: false })
      })
    })
  })

  describe('handleGoogleWebAuth (deprecated alias)', () => {
    it('should call handleGoogleAuth without isAndroid parameter', async () => {
      const mockUser = createMockUser()
      const mockResponse = createMockLoginResponse(mockUser, 'jwt-token')

      mockGoogleOAuthService.verifyWebToken.mockResolvedValue({
        email: 'test@example.com',
        sourceUserId: 'google-123',
      })
      mockUserService.findByEmailAndSource.mockResolvedValue(mockUser)
      mockAuthService.login.mockResolvedValue(mockResponse)

      const result = await service.handleGoogleWebAuth('id-token')

      expect(result).toEqual(mockResponse)
      expect(googleOAuthService.verifyWebToken).toHaveBeenCalled()
    })
  })

  describe('handleGoogleMobileAuth', () => {
    it('should call handleGoogleAuth with isAndroid parameter', async () => {
      const mockUser = createMockUser()
      const mockResponse = createMockLoginResponse(mockUser, 'jwt-token')

      mockGoogleOAuthService.decodeGoogleToken.mockResolvedValue({
        email: 'test@example.com',
        sourceUserId: 'google-123',
      })
      mockUserService.findByEmailAndSource.mockResolvedValue(mockUser)
      mockAuthService.login.mockResolvedValue(mockResponse)

      const result = await service.handleGoogleMobileAuth('id-token', true)

      expect(result).toEqual(mockResponse)
      expect(googleOAuthService.decodeGoogleToken).toHaveBeenCalledWith(
        'id-token',
        true,
      )
    })
  })

  describe('handleVerifiedOAuthUser', () => {
    it('should authenticate user with pre-verified user info', async () => {
      const mockUser = createMockUser()
      const mockResponse = createMockLoginResponse(mockUser, 'jwt-token')

      mockUserService.findByEmailAndSource.mockResolvedValue(mockUser)
      mockAuthService.login.mockResolvedValue(mockResponse)

      const result = await service.handleVerifiedOAuthUser({
        email: 'test@example.com',
        sourceUserId: 'google-123',
        name: 'Test User',
        pictureUrl: 'https://example.com/pic.jpg',
      })

      expect(result).toEqual(mockResponse)
      // Should not call any Google verification methods
      expect(googleOAuthService.verifyWebToken).not.toHaveBeenCalled()
      expect(googleOAuthService.decodeGoogleToken).not.toHaveBeenCalled()
    })

    it('should create new user from verified OAuth info', async () => {
      const mockUser = createMockUser({
        email: 'new@example.com',
        name: 'New User',
      })
      const mockResponse = createMockLoginResponse(mockUser, 'jwt-token')

      mockUserService.findByEmailAndSource.mockResolvedValue(null)
      mockUserService.createUserWithProfile.mockResolvedValue({
        user: mockUser,
        profile: { username: 'test' } as any,
      })
      mockAuthService.login.mockResolvedValue(mockResponse)

      const result = await service.handleVerifiedOAuthUser({
        email: 'new@example.com',
        sourceUserId: 'google-new-123',
        name: 'New User',
      })

      expect(result).toEqual(mockResponse)
      expect(userService.createUserWithProfile).toHaveBeenCalledWith({
        email: 'new@example.com',
        name: 'New User',
        sourceUserId: 'google-new-123',
        registrationType: RegistrationType.GOOGLE,
        requireEmailConfirmation: false,
      })
    })
  })
})

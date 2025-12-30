# Authentication Service Refactoring Guide

## Problem Statement

The current `AuthService` has **too many responsibilities** and **12 injected dependencies**, violating the Single Responsibility Principle:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService, // ✓ Auth concern
    private configService: ConfigService, // ✓ Auth concern
    private userService: UserService, // ✓ Auth concern
    private emailVerificationService: EmailVerificationService, // ✓ Auth concern
    private defaultResources: DefaultUserResourcesService, // ✗ User lifecycle concern
    private notificationClient: NotificationClient, // ✗ Duplicate with emailService
    private analytics: AnalyticsService, // ✓ Cross-cutting concern
    private pubsub: PubSubService, // ✗ User lifecycle concern
    private intercom: IntercomService, // ✗ User lifecycle concern
    private logger: StructuredLogger, // ✓ Cross-cutting concern
    private emailService: EmailService, // ✗ Should be in specialized services
    private passwordResetTokenStore: PasswordResetTokenStore, // ✗ Password reset concern
  ) {}
}
```

## Issues Identified

### 1. Duplication: NotificationClient vs EmailService

- `notificationClient.sendEmailVerification()` - old queue-based system
- `emailService.sendPasswordResetEmail()` - new direct Postmark integration
- **Inconsistent**: Registration uses queue, password reset uses direct email

### 2. Misplaced Responsibilities

- `defaultResources` - Should be in UserService or UserRegistrationService
- `pubsub`, `intercom` - User lifecycle events, not auth concerns
- `passwordResetTokenStore` - Password reset is a separate concern

### 3. Tight Coupling

- AuthService knows about user provisioning details
- AuthService knows about third-party integrations (Intercom)
- AuthService knows about event bus (PubSub)

### 4. Hard to Test

- 12 dependencies means complex mocking in tests
- Changes to user lifecycle affect auth tests
- Changes to notifications affect auth tests

---

## Refactored Architecture

### New Service Structure

```
┌─────────────────────────────────────────────────────────┐
│                     AuthController                      │
│  - Handles HTTP requests                                │
│  - Delegates to specialized services                    │
└────┬─────────────────────────────┬────────────────┬─────┘
     │                             │                │
     ▼                             ▼                ▼
┌──────────────┐        ┌─────────────────┐  ┌─────────────────────┐
│ AuthService  │        │PasswordReset    │  │ UserRegistration    │
│              │        │ Service          │  │ Service             │
├──────────────┤        ├─────────────────┤  ├─────────────────────┤
│• JWT tokens  │        │• Token gen      │  │• User creation      │
│• Login/      │        │• Email sending  │  │• Profile setup      │
│  Logout      │        │• Token validate │  │• Default resources  │
│• Token       │        │• Password hash  │  │• Email verify       │
│  validation  │        │                 │  │• Analytics          │
│• Email       │        │                 │  │• Pub/Sub events     │
│  confirm     │        │                 │  │• Intercom           │
└──────────────┘        └─────────────────┘  └─────────────────────┘
     │                             │                │
     └─────────────────────────────┴────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  UserService    │
                  │  (CRUD ops)     │
                  └─────────────────┘
```

### Service Responsibilities

#### 1. AuthService (8 dependencies → Lean and focused)

**Responsibilities:**

- JWT token generation and validation
- User login/logout
- Email confirmation (delegates to EmailVerificationService)
- **Delegates** registration to UserRegistrationService
- **Delegates** password reset to PasswordResetService

**Dependencies (8):**

```typescript
constructor(
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly userService: UserService,
  private readonly emailVerificationService: EmailVerificationService,
  private readonly userRegistrationService: UserRegistrationService,  // Delegate
  private readonly passwordResetService: PasswordResetService,        // Delegate
  private readonly analytics: AnalyticsService,
  private readonly logger: StructuredLogger,
) {}
```

#### 2. PasswordResetService (4 dependencies → Single purpose)

**Responsibilities:**

- Generate and store password reset tokens
- Send password reset emails
- Validate tokens and update passwords

**Dependencies (4):**

```typescript
constructor(
  private readonly userService: UserService,
  private readonly emailService: EmailService,
  private readonly passwordResetTokenStore: PasswordResetTokenStore,
  private readonly structuredLogger: StructuredLogger,
) {}
```

**Methods:**

- `requestPasswordReset(email)` - Generate token and send email
- `resetPassword(token, newPassword)` - Validate token and update password

#### 3. UserRegistrationService (9 dependencies → Focused on lifecycle)

**Responsibilities:**

- User creation and profile setup
- Provision default resources (filters, example items)
- Email verification management
- Analytics tracking for registration
- Pub/Sub event publishing
- Intercom contact creation

**Dependencies (9):**

```typescript
constructor(
  private readonly userService: UserService,
  private readonly emailVerificationService: EmailVerificationService,
  private readonly defaultResources: DefaultUserResourcesService,
  private readonly analytics: AnalyticsService,
  private readonly pubsub: PubSubService,
  private readonly intercom: IntercomService,
  private readonly emailService: EmailService,
  private readonly configService: ConfigService,
  private readonly structuredLogger: StructuredLogger,
) {}
```

**Methods:**

- `registerUser(input)` - Complete registration lifecycle
- `resendVerification(email)` - Resend verification email

---

## Migration Plan

### Phase 1: Create New Services (Non-Breaking)

1. ✅ Create `PasswordResetService` - Already done in `auth/services/password-reset.service.ts`
2. ✅ Create `UserRegistrationService` - Already done in `user/services/user-registration.service.ts`
3. ✅ Create refactored `AuthService` - Already done in `auth/services/auth.service.refactored.ts`

### Phase 2: Update Module Configuration

1. Update `UserModule` to provide `UserRegistrationService`
2. Update `AuthModule` to provide `PasswordResetService`
3. Update `AuthModule` to inject new services into AuthService

### Phase 3: Switch Implementation

1. Rename `auth.service.ts` to `auth.service.old.ts` (backup)
2. Rename `auth.service.refactored.ts` to `auth.service.ts`
3. Update imports in AuthController and other consumers

### Phase 4: Clean Up

1. Remove `notificationClient` usage (use `emailService` everywhere)
2. Remove `defaultResources` from AuthService
3. Remove old `auth.service.old.ts`
4. Update tests

### Phase 5: Test

1. Run unit tests for each service
2. Run E2E tests for auth flows
3. Verify:
   - Registration works
   - Email verification works
   - Password reset works
   - Login/logout works

---

## Benefits of Refactoring

### 1. Single Responsibility Principle

Each service has one clear purpose:

- `AuthService` - Authentication and JWT management
- `PasswordResetService` - Password reset flow
- `UserRegistrationService` - User lifecycle management

### 2. Easier Testing

```typescript
// Before: Need to mock 12 dependencies to test login
describe('AuthService', () => {
  let authService: AuthService
  let jwtService: JwtService
  let userService: UserService
  let defaultResources: DefaultUserResourcesService
  let analytics: AnalyticsService
  let pubsub: PubSubService
  let intercom: IntercomService
  let emailService: EmailService
  let notificationClient: NotificationClient
  // ... 4 more mocks
})

// After: Only mock relevant dependencies for login
describe('AuthService - Login', () => {
  let authService: AuthService
  let jwtService: JwtService
  let userService: UserService
  let analytics: AnalyticsService
  // Only 3-4 dependencies needed for login tests
})
```

### 3. Better Code Organization

```
Before:
auth/
  auth.service.ts (700+ lines, does everything)

After:
auth/
  services/
    auth.service.ts (300 lines, focused on JWT/login)
    password-reset.service.ts (150 lines, focused on pwd reset)
user/
  services/
    user-registration.service.ts (200 lines, focused on lifecycle)
```

### 4. Reusability

- `PasswordResetService` can be used independently (e.g., admin panel)
- `UserRegistrationService` can be used for bulk imports
- Services can be tested in isolation

### 5. Maintainability

- Change password reset logic? Edit one service
- Change user provisioning? Edit one service
- Add new auth method (OAuth)? Minimal changes to AuthService

---

## Code Comparison

### Before: AuthService (register method)

```typescript
async register(registerDto: RegisterDto) {
  // 1. Create user
  const result = await this.userService.registerUserComplete(registerDto)

  // 2. Provision resources
  await this.defaultResources.provisionForUser(result.user.id, {
    username: result.profile.username,
  })

  // 3. Track analytics
  this.analytics.trackUserCreated(
    result.user.id,
    result.user.email,
    result.profile.username,
    { status: result.user.status, hasInviteCode: !!registerDto.inviteCode }
  )

  // 4. Pub/sub events
  await this.pubsub.userCreated(
    result.user.id,
    result.user.email,
    result.user.name,
    result.profile.username,
  )

  // 5. Intercom
  await this.intercom.createUserContact(...)

  // 6. Email verification
  const verificationToken = await this.emailVerificationService.createVerificationToken(...)
  await this.notificationClient.sendEmailVerification(...)

  // 7. Return response
  if (requireConfirmation) {
    return { success: true, pendingEmailVerification: true }
  }
  return this.login(result.user)
}
```

**Issues:**

- 7 different concerns in one method
- Mixes user lifecycle with auth logic
- Hard to modify one aspect without affecting others

### After: AuthService (register method)

```typescript
async register(registerDto: RegisterDto) {
  // Delegate to specialized service
  const result = await this.userRegistrationService.registerUser({
    email: registerDto.email,
    password: registerDto.password,
    name: registerDto.name,
    inviteCode: registerDto.inviteCode,
  })

  // Handle auth response
  if (result.pendingEmailVerification) {
    return {
      success: true,
      message: 'Please check your email for verification.',
      pendingEmailVerification: true,
    }
  }

  // Auto-login
  const user = await this.userService.findById(result.user.id)
  return this.login(user)
}
```

**Benefits:**

- Clear separation of concerns
- Easy to understand
- Easy to test (just mock UserRegistrationService)
- AuthService focuses on auth (generating JWT), not user lifecycle

---

## Testing Strategy

### Unit Tests

#### AuthService Tests

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should generate JWT for valid user')
    it('should track login analytics')
    it('should reject inactive users')
  })

  describe('validateToken', () => {
    it('should validate JWT and return user')
    it('should return null for invalid token')
  })

  describe('register', () => {
    it('should delegate to UserRegistrationService')
    it('should auto-login if email verification not required')
    it('should return verification message if required')
  })

  describe('requestPasswordReset', () => {
    it('should delegate to PasswordResetService')
  })
})
```

#### PasswordResetService Tests

```typescript
describe('PasswordResetService', () => {
  describe('requestPasswordReset', () => {
    it('should generate token for valid user')
    it('should send email via EmailService')
    it('should return generic message for non-existent user')
    it('should prevent OAuth users from resetting password')
  })

  describe('resetPassword', () => {
    it('should validate token and update password')
    it('should send confirmation email')
    it('should throw error for invalid token')
  })
})
```

#### UserRegistrationService Tests

```typescript
describe('UserRegistrationService', () => {
  describe('registerUser', () => {
    it('should create user and profile')
    it('should provision default resources')
    it('should track analytics')
    it('should publish pub/sub events')
    it('should create Intercom contact')
    it('should send verification email if required')
  })

  describe('resendVerification', () => {
    it('should resend verification email')
    it('should throw error for verified user')
  })
})
```

---

## Files Changed

### Created

- ✅ `src/auth/services/password-reset.service.ts`
- ✅ `src/user/services/user-registration.service.ts`
- ✅ `src/auth/services/auth.service.refactored.ts`

### To Update (Phase 2-4)

- `src/user/user.module.ts` - Add UserRegistrationService to providers
- `src/auth/auth.module.ts` - Add PasswordResetService to providers
- `src/auth/auth.controller.ts` - Inject PasswordResetService
- `src/auth/services/auth.service.ts` - Replace with refactored version
- `src/auth/services/auth.service.spec.ts` - Update tests

### To Remove

- `notificationClient` usage (replace with `emailService`)
- Old auth.service.ts (after migration complete)

---

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback:**

   ```bash
   git checkout auth/services/auth.service.ts
   npm run build
   npm test
   ```

2. **Partial Rollback:**

   - Keep new services (PasswordResetService, UserRegistrationService)
   - Revert AuthService to original
   - Services can coexist during migration

3. **Full Rollback:**
   ```bash
   git revert <commit-hash>
   ```

---

## Next Steps

### Option 1: Gradual Migration (Recommended)

1. Merge new services into codebase (non-breaking)
2. Update module configuration
3. Run tests to verify everything works
4. Switch AuthService implementation in a separate commit
5. Monitor production for 24 hours
6. Remove old code after confirmation

### Option 2: Big Bang Migration

1. Switch all implementations at once
2. Run comprehensive test suite
3. Deploy with monitoring
4. Rollback if issues detected

### Option 3: Feature Flag

1. Add feature flag: `USE_REFACTORED_AUTH_SERVICE`
2. Switch between old and new implementation
3. Gradual rollout (10% → 50% → 100%)
4. Remove old code after full rollout

---

## Recommendation

**Use Option 1 (Gradual Migration)** because:

- ✅ Lowest risk
- ✅ Easy rollback
- ✅ Can test each piece independently
- ✅ Production impact minimized
- ✅ Team can review changes incrementally

---

## Summary

**Current State:**

- ❌ 12 dependencies in AuthService
- ❌ Multiple responsibilities mixed together
- ❌ Hard to test and maintain
- ❌ Duplicate email sending logic

**After Refactoring:**

- ✅ 3 focused services with clear responsibilities
- ✅ 4-9 dependencies each (reasonable)
- ✅ Easy to test and maintain
- ✅ Single email service (EmailService)
- ✅ Better code organization

**Effort:** ~4-6 hours including testing
**Risk:** Low (with gradual migration)
**Benefit:** High (long-term maintainability)

---

**Questions? Contact the team or open a GitHub discussion.**

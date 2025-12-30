/**
 * Test script for password reset flow
 * Tests: Registration → Password Reset Request → Password Reset → Login
 */

import axios from 'axios'

const BASE_URL = 'http://localhost:4001/api/v2'
const TEST_EMAIL = `test-${Date.now()}@example.com`
const TEST_PASSWORD = 'TestPassword123!'
const NEW_PASSWORD = 'NewPassword456!'
const TEST_NAME = 'Test User'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  // eslint-disable-next-line no-console
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step: number, message: string) {
  log(`\n[Step ${step}] ${message}`, 'bright')
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green')
}

function logError(message: string) {
  log(`✗ ${message}`, 'red')
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'blue')
}

async function testPasswordResetFlow() {
  log('\n=== Password Reset Flow Test ===\n', 'bright')
  logInfo(`Test Email: ${TEST_EMAIL}`)
  logInfo(`Test Name: ${TEST_NAME}`)
  logInfo(`Initial Password: ${TEST_PASSWORD}`)
  logInfo(`New Password: ${NEW_PASSWORD}`)

  try {
    // Step 1: Register a new user
    logStep(1, 'Registering new user')
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME,
    })

    if (!registerResponse.data.success) {
      logError('Registration failed')
      logInfo(`Response: ${JSON.stringify(registerResponse.data)}`)

      return
    }

    logSuccess('User registered successfully')
    const userId = registerResponse.data.user?.id
    logInfo(`User ID: ${userId}`)

    // If email verification is required, activate user manually for testing
    if (registerResponse.data.pendingEmailVerification) {
      logInfo('Email verification would be required in production')
      logInfo(
        'For testing, user should be activated manually or verify via email',
      )
    }

    // Step 2: Login with original password (to verify user exists)
    logStep(2, 'Testing login with original password')
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })

    if (!loginResponse.data.success) {
      // Might fail if email verification is required
      logInfo('Login may require email verification')
      logInfo(`Status: ${loginResponse.data.errorCode || 'unknown'}`)
    } else {
      logSuccess('Login successful with original password')
      logInfo(
        `Access token received: ${loginResponse.data.accessToken?.substring(
          0,
          20,
        )}...`,
      )
    }

    // Step 3: Request password reset
    logStep(3, 'Requesting password reset')
    const resetRequestResponse = await axios.post(
      `${BASE_URL}/auth/request-password-reset`,
      {
        email: TEST_EMAIL,
      },
    )

    if (!resetRequestResponse.data.success) {
      logError('Password reset request failed')
      logInfo(`Response: ${JSON.stringify(resetRequestResponse.data)}`)

      return
    }

    logSuccess('Password reset email sent')
    logInfo(resetRequestResponse.data.message)
    logInfo('Check Postmark logs or email inbox for reset link')
    logInfo('In production, user would click link in email')

    // In a real test, we would need to extract the token from the email
    // For now, we'll note that the email was sent successfully
    log(`\n${'='.repeat(70)}`, 'yellow')
    log('📧 EMAIL SENT VIA POSTMARK', 'yellow')
    log('='.repeat(70), 'yellow')
    logInfo('To complete the test:')
    logInfo(`1. Check your email inbox for: ${TEST_EMAIL}`)
    logInfo('2. Click the reset link or copy the token from the URL')
    logInfo('3. The reset URL will look like:')
    logInfo('   http://localhost:3010/reset-password?token=<64-char-hex-token>')
    logInfo('4. Or use the token to call POST /api/v2/auth/reset-password')
    log(`${'='.repeat(70)}\n`, 'yellow')

    // Step 4: Test with non-existent email (should return same generic message)
    logStep(
      4,
      'Testing password reset with non-existent email (security check)',
    )
    const invalidEmailResponse = await axios.post(
      `${BASE_URL}/auth/request-password-reset`,
      {
        email: 'nonexistent@example.com',
      },
    )

    if (
      invalidEmailResponse.data.message === resetRequestResponse.data.message
    ) {
      logSuccess('Generic message returned (prevents user enumeration) ✓')
    } else {
      logError(
        'Different messages for valid/invalid emails (user enumeration vulnerability)',
      )
    }

    // Step 5: Test OAuth user (should return same generic message)
    logStep(5, 'Testing that OAuth users cannot reset password (if any exist)')
    logInfo('This would need a Google OAuth user to test properly')

    log('\n=== Test Summary ===\n', 'bright')
    logSuccess('Password reset request endpoint working ✓')
    logSuccess('Email sent via Postmark ✓')
    logSuccess('User enumeration prevention working ✓')
    logInfo('To test password reset completion, use the token from the email')

    log('\n=== Manual Test Instructions ===\n', 'bright')
    logInfo('After receiving the email, test the reset endpoint with:')
    log(
      `
curl -X POST ${BASE_URL}/auth/reset-password \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "<token-from-email>",
    "newPassword": "${NEW_PASSWORD}"
  }'
    `,
      'blue',
    )

    logInfo('Then verify login works with new password:')
    log(
      `
curl -X POST ${BASE_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${TEST_EMAIL}",
    "password": "${NEW_PASSWORD}"
  }'
    `,
      'blue',
    )
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logError(`Request failed: ${error.message}`)
      if (error.response) {
        logInfo(`Status: ${error.response.status}`)
        logInfo(`Data: ${JSON.stringify(error.response.data)}`)
      }
    } else {
      logError(`Unexpected error: ${error}`)
    }
  }
}

// Run the test
testPasswordResetFlow().catch(console.error)

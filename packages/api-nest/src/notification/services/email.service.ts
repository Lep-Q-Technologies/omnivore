import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { EnvVariables } from '../../config/env-variables'
import { EmailMessage, EmailSendResult } from '../interfaces/email.interface'
import { PostmarkEmailProvider } from '../providers/postmark-email.provider'

/**
 * High-level email service
 * Provides convenient methods for common email operations
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  private readonly frontendUrl: string

  constructor(
    private readonly postmarkProvider: PostmarkEmailProvider,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>(EnvVariables.FRONTEND_URL) ||
      'http://localhost:3000'
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(
    to: string,
    token: string,
  ): Promise<EmailSendResult> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Verify your email address</h1>
            <p>Thank you for signing up for Omnivore! To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account with Omnivore, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} Omnivore. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Verify your email address

Thank you for signing up for Omnivore! To complete your registration, please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with Omnivore, you can safely ignore this email.
    `

    return this.postmarkProvider.send({
      to,
      subject: 'Verify your Omnivore account',
      html,
      text,
    })
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    token: string,
  ): Promise<EmailSendResult> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset your password</h1>
            <p>We received a request to reset the password for your Omnivore account. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <div class="warning">
              <strong>Security note:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <div class="footer">
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              <p>For security, never share this email with anyone.</p>
              <p>© ${new Date().getFullYear()} Omnivore. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Reset your password

We received a request to reset the password for your Omnivore account. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    `

    return this.postmarkProvider.send({
      to,
      subject: 'Reset your Omnivore password',
      html,
      text,
    })
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedNotification(to: string): Promise<EmailSendResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert { background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 12px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password changed</h1>
            <div class="alert">
              Your Omnivore password was successfully changed.
            </div>
            <p>If you made this change, you can safely ignore this email.</p>
            <p>If you didn't change your password, please contact us immediately at support@omnivore.app.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Omnivore. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Password changed

Your Omnivore password was successfully changed.

If you made this change, you can safely ignore this email.

If you didn't change your password, please contact us immediately at support@omnivore.app.
    `

    return this.postmarkProvider.send({
      to,
      subject: 'Your Omnivore password was changed',
      html,
      text,
    })
  }

  /**
   * Send generic email (for custom use cases)
   */
  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    return this.postmarkProvider.send(message)
  }

  /**
   * Send batch emails
   */
  async sendBatch(messages: EmailMessage[]): Promise<EmailSendResult[]> {
    return this.postmarkProvider.sendBatch(messages)
  }
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, BookOpen, CheckCircle2, Loader2, Mail } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api-client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationError(null)

    // Client-side validation
    if (!email.includes('@')) {
      setValidationError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await apiClient.requestPasswordReset(email)

      if (response.success) {
        setSuccess(true)
      } else {
        setError(response.message || 'Failed to send reset email')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-8 w-8" />
            <span>Omnivore</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Reset your password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    If an account exists with that email, we've sent a password
                    reset link. Please check your inbox.
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>The link will expire in 1 hour for security reasons.</p>
                  <p>
                    Didn't receive an email? Check your spam folder or try
                    again.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {(error || validationError) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {validationError || error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="pl-10"
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="flex items-center justify-center gap-1 text-sm">
              <span className="text-muted-foreground">
                Remember your password?
              </span>
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>

            {!success && (
              <div className="text-xs text-center text-muted-foreground">
                <p>
                  For security, we'll always show a success message even if the
                  email doesn't exist in our system.
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { useAuthStore } from "@/stores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, User, AlertCircle, BookOpen, CheckCircle2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function Register() {
  const navigate = useNavigate()
  const {
    isAuthenticated,
    isLoading,
    error,
    statusMessage,
    pendingEmailVerification,
    register,
    clearError,
    clearStatus,
    setToken,
  } = useAuthStore()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState("")

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/library", { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Clear errors when user starts typing
  useEffect(() => {
    if (error || validationError) {
      clearError()
      setValidationError("")
    }
  }, [name, email, password, confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")
    clearStatus()

    // Client-side validation
    if (!name || !email || !password || !confirmPassword) {
      setValidationError("Please fill in all fields")
      return
    }

    if (name.length < 2) {
      setValidationError("Name must be at least 2 characters")
      return
    }

    if (!email.includes("@")) {
      setValidationError("Please enter a valid email address")
      return
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match")
      return
    }

    await register(email, password, name)
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      console.log("Google signup successful, credential:", credentialResponse)

      const idToken = credentialResponse.credential

      if (!idToken) {
        setValidationError("Failed to get Google credentials")
        return
      }

      // Call backend to exchange Google ID token for app auth
      // Backend handles both new user creation and existing user login
      const result = await apiClient.googleSignIn(idToken, true, false)

      console.log("Backend response:", result)

      if (result.success && result.accessToken) {
        // Update auth store with token - this sets both localStorage and Zustand state
        setToken(result.accessToken)
        // Navigate will happen automatically via useEffect when isAuthenticated becomes true
        navigate("/library", { replace: true })
      } else {
        setValidationError("Google sign-up failed. Please try again.")
      }
    } catch (error) {
      console.error("Google sign-up error:", error)
      setValidationError("Google sign-up failed. Please try again.")
    }
  }

  const handleGoogleError = () => {
    console.error("Google signup error")
    setValidationError("Google sign-up failed. Please try again.")
  }

  // Show success message if email verification is pending
  if (pendingEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              Check your email
            </CardTitle>
            <CardDescription className="text-center">
              {statusMessage || "We've sent you a verification link"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please check your email inbox and click the verification link to
              activate your account.
            </p>
            <div className="text-sm text-center">
              <Link to="/login" className="text-primary hover:underline">
                Return to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <BookOpen className="h-8 w-8" />
            <span>Omnivore</span>
          </Link>
        </div>

        {/* Registration Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Create an account
            </CardTitle>
            <CardDescription className="text-center">
              Start your reading journey with Omnivore
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {(error || validationError) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {validationError || error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {statusMessage && !error && !validationError && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{statusMessage}</AlertDescription>
                </Alert>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
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
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid gap-2">
              <div id="google-signup-button">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  type="standard"
                  theme="outline"
                  size="large"
                  text="signup_with"
                  width="384"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-xs text-center text-muted-foreground">
              By signing up, you agree to Omnivore's{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </div>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

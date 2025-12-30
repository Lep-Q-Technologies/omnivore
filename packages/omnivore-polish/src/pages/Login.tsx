import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { useAuthStore } from "@/stores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, AlertCircle, BookOpen } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, error, login, clearError, setToken } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
  }, [email, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    // Client-side validation
    if (!email || !password) {
      setValidationError("Please fill in all fields")
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

    await login(email, password)
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      console.log("Google login successful, credential:", credentialResponse)

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
        setValidationError("Google sign-in failed. Please try again.")
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      setValidationError("Google sign-in failed. Please try again.")
    }
  }

  const handleGoogleError = () => {
    console.error("Google login error")
    setValidationError("Google sign-in failed. Please try again.")
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

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
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
                    autoComplete="current-password"
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
                    Signing in...
                  </>
                ) : (
                  "Sign in"
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
              <div id="google-signin-button">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  type="standard"
                  theme="outline"
                  size="large"
                  text="continue_with"
                  width="384"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              By signing in, you agree to Omnivore's{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Protected Route Component
 *
 * Ensures user is authenticated before accessing protected pages.
 * Redirects to /login if not authenticated.
 * Shows loading state while verifying authentication.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, verifyAuth } = useAuthStore()
  const location = useLocation()

  // Verify auth on mount
  useEffect(() => {
    verifyAuth()
  }, [verifyAuth])

  // Show loading state while verifying
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Render protected content
  return <>{children}</>
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLibraryItems } from "@/hooks/useLibraryItems"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Book } from "lucide-react"

/**
 * API Test Page - Verifies GraphQL integration with api-nest
 *
 * This page tests the Tanstack Query + GraphQL setup by fetching library items
 * Access at: http://localhost:3010/api-test
 */
export default function ApiTest() {
  const { data, isLoading, error, isSuccess } = useLibraryItems({
    first: 5,
    search: {
      folder: 'inbox',
      sortBy: 'SAVED_AT',
      sortOrder: 'DESC'
    }
  })

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GraphQL Integration Test</h1>
        <p className="text-muted-foreground">
          Testing connection to api-nest backend via Tanstack Query
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isSuccess && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {error && <XCircle className="h-5 w-5 text-red-500" />}
            Connection Status
          </CardTitle>
          <CardDescription>
            API Endpoint: {import.meta.env.VITE_API_URL || '/api/graphql'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Loading</AlertTitle>
              <AlertDescription>
                Fetching library items from api-nest...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error.message || 'Failed to connect to API'}
              </AlertDescription>
            </Alert>
          )}

          {isSuccess && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Fetched {data.items.length} library items from api-nest
                {data.nextCursor && ` (more available)`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Card */}
      {isSuccess && data.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Library Items ({data.items.length})
            </CardTitle>
            <CardDescription>
              First {data.items.length} items from your inbox
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="border-l-4 border-primary pl-4 py-2"
                >
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  {item.author && (
                    <p className="text-sm text-muted-foreground mb-1">
                      by {item.author}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    {item.savedAt && (
                      <span>Saved: {new Date(item.savedAt).toLocaleDateString()}</span>
                    )}
                    {item.wordCount && (
                      <span>• {item.wordCount} words</span>
                    )}
                    {item.readingProgressPercent > 0 && (
                      <span>• {Math.round(item.readingProgressPercent)}% read</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {isSuccess && data.items.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No library items found</p>
              <p className="text-sm mt-2">
                API connection successful, but your inbox is empty
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

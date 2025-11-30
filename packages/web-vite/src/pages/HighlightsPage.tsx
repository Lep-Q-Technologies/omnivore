// Highlights page - shows all user highlights across all articles
// Each highlight links back to its source article

import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { graphqlRequest } from '../lib/graphql-client'
import { HIGHLIGHT_WITH_ARTICLE_FRAGMENT } from '../lib/graphql-fragments'
import { useAuthStore } from '../stores'
import ErrorBoundary from '../components/ErrorBoundary'

const USER_HIGHLIGHTS_QUERY = `
  ${HIGHLIGHT_WITH_ARTICLE_FRAGMENT}
  query UserHighlights($first: Int!, $after: String) {
    userHighlights(first: $first, after: $after) {
      highlights {
        ...HighlightWithArticleFields
      }
      nextCursor
    }
  }
`

const INITIAL_PAGE_SIZE = 50

interface Highlight {
  id: string
  shortId: string
  libraryItemId: string
  quote?: string | null
  annotation?: string | null
  createdAt: string
  color: string
  libraryItem?: {
    id: string
    title: string
    slug: string
    author?: string | null
    siteName?: string | null
    siteIcon?: string | null
    originalUrl: string
    savedAt: string
    contentType: string
  } | null
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  YELLOW: '#ffd234',
  RED: '#ff6b6b',
  GREEN: '#51cf66',
  BLUE: '#4dabf7',
}

const HighlightsPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch highlights on mount and whenever we navigate to this page
  // Using location.key ensures refetch when navigating back via browser back button
  // Fetch highlights on mount and when user changes
  useEffect(() => {
    let isMounted = true
    
    const fetchHighlights = async () => {
      if (!user) return

      try {
        setLoading(true)

        const data = await graphqlRequest<{
          userHighlights: {
            highlights: Highlight[]
            nextCursor: string | null
          }
        }>(USER_HIGHLIGHTS_QUERY, {
          first: INITIAL_PAGE_SIZE,
        })

        if (isMounted) {
          setHighlights(data.userHighlights.highlights)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching highlights:', err)
          setError(
            err instanceof Error ? err.message : 'Failed to load highlights',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchHighlights()

    return () => {
      isMounted = false
    }
  }, [user]) // Removed location.key to prevent unnecessary refetches and potential race conditions

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleHighlightClick = (highlight: Highlight) => {
    if (highlight.libraryItem) {
      // Navigate to reader with highlight ID as anchor
      navigate(`/reader/${highlight.libraryItem.id}#${highlight.shortId}`)
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your highlights...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="highlights-page">
        <div className="highlights-header">
          <h1>Your Highlights</h1>
          <p className="highlights-count">
            {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
          </p>
        </div>

        {highlights.length === 0 ? (
          <div className="empty-state">
            <h2>No highlights yet</h2>
            <p>
              Highlights you create while reading will appear here. Start
              reading and highlighting!
            </p>
          </div>
        ) : (
          <div className="highlights-list">
            {highlights.map((highlight) => (
              <div
                key={highlight.id}
                className="highlight-card"
                onClick={() => handleHighlightClick(highlight)}
                style={{
                  borderLeftColor:
                    HIGHLIGHT_COLORS[highlight.color] || HIGHLIGHT_COLORS.YELLOW,
                }}
              >
                {/* Highlight quote */}
                {highlight.quote && (
                  <div className="highlight-quote">{highlight.quote}</div>
                )}

                {/* Annotation/note */}
                {highlight.annotation && (
                  <div className="highlight-annotation">
                    <strong>Note:</strong> {highlight.annotation}
                  </div>
                )}

                {/* Source article info */}
                {highlight.libraryItem && (
                  <div className="highlight-source">
                    <div className="source-info">
                      {highlight.libraryItem.siteIcon && (
                        <img
                          src={highlight.libraryItem.siteIcon}
                          alt=""
                          className="source-icon"
                        />
                      )}
                      <div className="source-details">
                        <div className="source-title">
                          {highlight.libraryItem.title}
                        </div>
                        <div className="source-meta">
                          {highlight.libraryItem.author && (
                            <span>{highlight.libraryItem.author}</span>
                          )}
                          {highlight.libraryItem.siteName && (
                            <span> · {highlight.libraryItem.siteName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="highlight-date">
                      {formatDate(highlight.createdAt)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default HighlightsPage

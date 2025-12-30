import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphqlRequest } from '../lib/graphql-client'
import type { LibraryItem } from '../types/api'

export interface LibrarySearchInput {
  /** Filter by folder (inbox, archive, trash, all) */
  folder?: string
  /** Filter items that have highlights/annotations */
  hasHighlights?: boolean
  /** Filter by label names (items with ANY of these labels) */
  labels?: string[]
  /** Search query for full-text search */
  query?: string
  /** Field to sort by */
  sortBy?: 'SAVED_AT' | 'UPDATED_AT' | 'PUBLISHED_AT' | 'READ_AT' | 'SCORE'
  /** Sort order */
  sortOrder?: 'ASC' | 'DESC'
}

export interface LibraryItemsConnection {
  items: LibraryItem[]
  nextCursor?: string
}

interface LibraryItemsQueryResponse {
  libraryItems: LibraryItemsConnection
}

const LIBRARY_ITEMS_QUERY = `
  query LibraryItems($first: Int, $after: String, $search: LibrarySearchInput) {
    libraryItems(first: $first, after: $after, search: $search) {
      items {
        id
        title
        slug
        author
        description
        createdAt
        savedAt
        publishedAt
        readAt
        updatedAt
        state
        isArchived
        readingProgressPercent
        readingProgressAnchorIndex
        wordCount
        thumbnail
        siteIcon
        siteName
        originalArticleUrl
        contentReader
        labels {
          id
          name
          color
        }
      }
      nextCursor
    }
  }
`

export interface UseLibraryItemsOptions {
  /** Number of items to fetch (default: 20) */
  first?: number
  /** Cursor for pagination */
  after?: string
  /** Search filters */
  search?: LibrarySearchInput
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Tanstack Query hook for fetching library items
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useLibraryItems({
 *   search: { folder: 'inbox', sortBy: 'SAVED_AT', sortOrder: 'DESC' },
 *   first: 20
 * })
 * ```
 */
export function useLibraryItems({
  first = 20,
  after,
  search,
  enabled = true,
}: UseLibraryItemsOptions = {}): UseQueryResult<LibraryItemsConnection, Error> {
  return useQuery({
    queryKey: ['libraryItems', { first, after, search }],
    queryFn: async () => {
      const response = await graphqlRequest<LibraryItemsQueryResponse>(
        LIBRARY_ITEMS_QUERY,
        { first, after, search }
      )
      return response.libraryItems
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

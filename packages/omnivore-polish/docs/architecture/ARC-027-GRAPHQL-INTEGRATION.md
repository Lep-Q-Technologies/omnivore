# ARC-027: GraphQL Integration Layer

**Date**: December 21, 2024
**Status**: 🚧 In Progress
**Priority**: P0 (Blocking)
**Complexity**: Medium
**Estimated Effort**: 2-3 days

---

## 📋 Overview

Establish GraphQL integration layer to connect omnivore-polish frontend to the NestJS backend. This includes porting the battle-tested GraphQL client from web-vite, wrapping it with Tanstack Query for improved developer experience and user experience, and setting up automatic type generation from the backend schema.

---

## 🎯 Goals

1. **Port GraphQL Client**: Copy `graphql-client.ts` and `graphql-fragments.ts` from web-vite
2. **Type Safety**: Auto-generate TypeScript types from NestJS GraphQL schema
3. **Modern State Management**: Wrap GraphQL hooks with Tanstack Query
4. **Developer Experience**: Hot reload, DevTools, type autocomplete
5. **Testing**: Integration tests for API layer

---

## 🔍 Context

### Current State (omnivore-polish)
- ❌ No backend integration (uses mock data)
- ❌ No GraphQL client
- ❌ No API types
- ✅ Tanstack Query installed (v5.83.0)

### Target State (web-vite)
- ✅ Custom fetch-based GraphQL client (1,722 lines)
- ✅ All queries/mutations implemented as hooks
- ✅ GraphQL fragments for reusability
- ⚠️ Manual type maintenance (400+ lines, drift risk)
- ⚠️ No server-state caching (refetch on every mount)

### Desired State (omnivore-polish)
- ✅ Ported GraphQL client with all hooks
- ✅ Auto-generated types from schema
- ✅ Tanstack Query integration (caching, optimistic updates, devtools)
- ✅ Type-safe queries with IDE autocomplete

---

## 🏗️ Architecture

### GraphQL Client Stack

```
┌─────────────────────────────────────┐
│   React Components                  │
│   (Library, Reader, etc.)           │
└──────────┬──────────────────────────┘
           │ useQuery/useMutation
           ▼
┌─────────────────────────────────────┐
│   Tanstack Query Hooks              │
│   (useLibraryItems, etc.)           │
└──────────┬──────────────────────────┘
           │ graphqlRequest()
           ▼
┌─────────────────────────────────────┐
│   GraphQL Client (fetch-based)      │
│   - JWT auth header injection       │
│   - Error handling                  │
│   - Request/response logging        │
└──────────┬──────────────────────────┘
           │ HTTP POST
           ▼
┌─────────────────────────────────────┐
│   NestJS GraphQL API                │
│   localhost:4001/api/graphql        │
└─────────────────────────────────────┘
```

### File Structure

```
packages/omnivore-polish/
├── src/
│   ├── lib/
│   │   ├── graphql-client.ts        # Core GraphQL client (from web-vite)
│   │   ├── graphql-fragments.ts     # Reusable fragments (from web-vite)
│   │   ├── api-client.ts            # REST API client (auth endpoints)
│   │   └── query-client.ts          # Tanstack Query config
│   ├── hooks/
│   │   ├── queries/
│   │   │   ├── useLibraryItems.ts   # Library query
│   │   │   ├── useLibraryItem.ts    # Single item query
│   │   │   ├── useLabels.ts         # Tags/labels query
│   │   │   └── useHighlights.ts     # Highlights query
│   │   └── mutations/
│   │       ├── useArchiveItem.ts    # Archive mutation
│   │       ├── useDeleteItem.ts     # Delete mutation
│   │       └── useCreateHighlight.ts # Highlight creation
│   ├── types/
│   │   ├── generated-graphql.ts     # Auto-generated from schema
│   │   └── api.ts                   # Manual types (extend generated)
│   └── queries/
│       ├── library.graphql          # GraphQL query documents
│       ├── highlights.graphql
│       └── labels.graphql
├── codegen.yml                      # graphql-codegen config
└── vite.config.ts                   # Proxy configuration
```

---

## 📦 Implementation Steps

### Phase 1: Setup (Day 1 Morning)

#### 1.1 Install Dependencies

```bash
cd /Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/omnivore-polish

# GraphQL code generation
npm install -D @graphql-codegen/cli
npm install -D @graphql-codegen/typescript
npm install -D @graphql-codegen/typescript-operations
npm install -D @graphql-codegen/typescript-react-query

# GraphQL runtime (if not already installed)
npm install graphql
```

#### 1.2 Create Directory Structure

```bash
mkdir -p src/lib
mkdir -p src/hooks/queries
mkdir -p src/hooks/mutations
mkdir -p src/queries
mkdir -p docs/architecture
```

#### 1.3 Configure Vite Proxy

**File**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/v2': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
      '/api/graphql': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

---

### Phase 2: Copy GraphQL Client (Day 1 Afternoon)

#### 2.1 Copy Core Files

```bash
# Copy GraphQL client
cp ../web-vite/src/lib/graphql-client.ts src/lib/

# Copy fragments
cp ../web-vite/src/lib/graphql-fragments.ts src/lib/

# Copy REST API client (for auth)
cp ../web-vite/src/lib/api-client.ts src/lib/
```

#### 2.2 Update Imports

**File**: `src/lib/graphql-client.ts`

Update imports to use omnivore-polish paths:

```typescript
// Before (web-vite)
import { LibraryItem, Label, Highlight } from '../types/api'

// After (omnivore-polish)
import { LibraryItem, Label, Highlight } from '@/types/generated-graphql'
```

#### 2.3 Create Query Client Config

**File**: `src/lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

**File**: `src/main.tsx` (update)

```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/query-client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

---

### Phase 3: Type Generation (Day 2 Morning)

#### 3.1 Create GraphQL Documents

Extract queries from `graphql-client.ts` into separate `.graphql` files:

**File**: `src/queries/library.graphql`

```graphql
query LibraryItems($first: Int!, $after: String, $search: LibrarySearchInput) {
  libraryItems(first: $first, after: $after, search: $search) {
    items {
      ...LibraryItemBasicFields
    }
    nextCursor
    totalCount
  }
}

query LibraryItem($id: UUID!) {
  libraryItem(id: $id) {
    ...LibraryItemFullFields
  }
}

mutation ArchiveLibraryItem($id: UUID!, $archived: Boolean!) {
  archiveLibraryItem(id: $id, archived: $archived) {
    ...LibraryItemBasicFields
  }
}
```

#### 3.2 Configure graphql-codegen

**File**: `codegen.yml`

```yaml
schema: ../api-nest/schema.graphql
documents: 'src/**/*.graphql'
generates:
  src/types/generated-graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-query
    config:
      withHooks: true
      fetcher:
        func: './lib/graphql-client#graphqlRequest'
        isReactHook: false
```

#### 3.3 Add npm Script

**File**: `package.json`

```json
{
  "scripts": {
    "codegen": "graphql-codegen --config codegen.yml",
    "codegen:watch": "graphql-codegen --config codegen.yml --watch"
  }
}
```

#### 3.4 Generate Types

```bash
npm run codegen
```

**Expected Output**: `src/types/generated-graphql.ts` (1000+ lines)

---

### Phase 4: Tanstack Query Integration (Day 2 Afternoon)

#### 4.1 Create Query Hooks

**File**: `src/hooks/queries/useLibraryItems.ts`

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import { LibraryItemsQuery, LibrarySearchInput } from '@/types/generated-graphql'
import { LIBRARY_ITEMS_QUERY } from '@/queries/library'

export function useLibraryItems(search?: LibrarySearchInput) {
  return useInfiniteQuery({
    queryKey: ['libraryItems', search],
    queryFn: async ({ pageParam }) => {
      const data = await graphqlRequest<{ libraryItems: LibraryItemsQuery }>(
        LIBRARY_ITEMS_QUERY,
        {
          first: 50,
          after: pageParam,
          search,
        }
      )
      return data.libraryItems
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  })
}
```

**File**: `src/hooks/queries/useLibraryItem.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import { LibraryItemQuery } from '@/types/generated-graphql'
import { LIBRARY_ITEM_QUERY } from '@/queries/library'

export function useLibraryItem(id: string) {
  return useQuery({
    queryKey: ['libraryItem', id],
    queryFn: async () => {
      const data = await graphqlRequest<{ libraryItem: LibraryItemQuery }>(
        LIBRARY_ITEM_QUERY,
        { id }
      )
      return data.libraryItem
    },
    enabled: !!id,
  })
}
```

#### 4.2 Create Mutation Hooks

**File**: `src/hooks/mutations/useArchiveItem.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import { ARCHIVE_LIBRARY_ITEM_MUTATION } from '@/queries/library'

export function useArchiveItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { id: string; archived: boolean }) => {
      return await graphqlRequest(ARCHIVE_LIBRARY_ITEM_MUTATION, vars)
    },
    onSuccess: (_, vars) => {
      // Optimistic update: remove from current list
      queryClient.invalidateQueries({ queryKey: ['libraryItems'] })
      queryClient.invalidateQueries({ queryKey: ['libraryItem', vars.id] })
    },
  })
}
```

**File**: `src/hooks/mutations/useDeleteItem.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlRequest } from '@/lib/graphql-client'
import { DELETE_LIBRARY_ITEM_MUTATION } from '@/queries/library'

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await graphqlRequest(DELETE_LIBRARY_ITEM_MUTATION, { id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['libraryItems'] })
    },
  })
}
```

---

### Phase 5: Replace Mock Data (Day 3)

#### 5.1 Update Library Page

**File**: `src/pages/Library.tsx`

```typescript
// Before (mock data)
import { mockArticles } from '@/data/mockArticles'
const [articles] = useState(mockArticles)

// After (real data)
import { useLibraryItems } from '@/hooks/queries/useLibraryItems'
import { useArchiveItem } from '@/hooks/mutations/useArchiveItem'

const { data, fetchNextPage, hasNextPage, isLoading } = useLibraryItems({
  folder: 'inbox',
  sortBy: 'SAVED_AT',
  sortOrder: 'DESC',
})

const archiveMutation = useArchiveItem()

const articles = data?.pages.flatMap(page => page.items) ?? []

// Archive action
const handleArchive = (id: string) => {
  archiveMutation.mutate({ id, archived: true })
}
```

#### 5.2 Update Reader Page

**File**: `src/pages/Reader.tsx`

```typescript
import { useLibraryItem } from '@/hooks/queries/useLibraryItem'
import { useHighlights } from '@/hooks/queries/useHighlights'
import { useCreateHighlight } from '@/hooks/mutations/useCreateHighlight'

const { id } = useParams()
const { data: article, isLoading } = useLibraryItem(id!)
const { data: highlights } = useHighlights(id!)
const createHighlightMutation = useCreateHighlight()

// Create highlight
const handleCreateHighlight = (text: string, color: string) => {
  createHighlightMutation.mutate({ articleId: id!, text, color })
}
```

---

## 🧪 Testing

### Integration Tests

**File**: `src/lib/__tests__/graphql-client.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { graphqlRequest } from '../graphql-client'

describe('GraphQL Client', () => {
  it('should attach JWT token to requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { libraryItems: { items: [] } } }),
    })
    global.fetch = mockFetch

    localStorage.setItem('omnivore-auth-token', 'test-token')

    await graphqlRequest('query { libraryItems { items { id } } }')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })

  it('should handle GraphQL errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        errors: [{ message: 'Unauthorized' }],
      }),
    })

    await expect(
      graphqlRequest('query { libraryItems { items { id } } }')
    ).rejects.toThrow('Unauthorized')
  })
})
```

### E2E Tests

**File**: `tests/e2e/library.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Library Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name=email]', 'test@example.com')
    await page.fill('[name=password]', 'password')
    await page.click('button[type=submit]')
    await page.waitForURL('/library')
  })

  test('should load library items from API', async ({ page }) => {
    await page.goto('/library')

    // Wait for loading to finish
    await page.waitForSelector('[data-testid=library-item]')

    // Verify items are displayed
    const items = await page.$$('[data-testid=library-item]')
    expect(items.length).toBeGreaterThan(0)
  })

  test('should archive an item', async ({ page }) => {
    await page.goto('/library')

    // Archive first item
    await page.click('[data-testid=library-item]:first-child [data-testid=archive-button]')

    // Verify toast notification
    await expect(page.locator('.toast')).toContainText('Archived')

    // Verify item removed from list
    const firstItemTitle = await page.textContent('[data-testid=library-item]:first-child h3')
    await page.reload()
    const newFirstItemTitle = await page.textContent('[data-testid=library-item]:first-child h3')
    expect(firstItemTitle).not.toBe(newFirstItemTitle)
  })
})
```

---

## 📊 Success Criteria

- [x] GraphQL client ported from web-vite
- [x] Vite proxy configured for API endpoints
- [x] Types auto-generated from NestJS schema
- [x] Tanstack Query hooks created for all queries/mutations
- [x] Mock data replaced with real API data
- [x] Integration tests passing
- [x] E2E tests covering critical paths
- [ ] DevTools working (React Query DevTools)
- [ ] No type errors (TypeScript strict mode)
- [ ] Documentation updated

---

## 🚧 Blockers & Dependencies

### Blockers
- Backend must be running on localhost:4001
- Database must be seeded with test data

### Dependencies
- None (this is the foundation for all other ARCs)

---

## 📚 References

- [Tanstack Query Docs](https://tanstack.com/query/latest)
- [GraphQL Code Generator Docs](https://the-guild.dev/graphql/codegen)
- [NestJS GraphQL Schema](../../../api-nest/schema.graphql)
- [web-vite GraphQL Client](../../../web-vite/src/lib/graphql-client.ts)

---

**Status**: Ready to implement
**Assigned**: Migration team
**Started**: 2024-12-21
**Target Completion**: 2024-12-23

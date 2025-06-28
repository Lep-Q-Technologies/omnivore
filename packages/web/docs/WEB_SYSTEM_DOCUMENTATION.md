# Omnivore Web System Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Pages and Routing](#pages-and-routing)
6. [API Integration](#api-integration)
7. [State Management](#state-management)
8. [Authentication & Security](#authentication--security)
9. [Build & Deployment](#build--deployment)
10. [Features Analysis for Lighter Version](#features-analysis-for-lighter-version)
11. [Recommendations](#recommendations)

## Architecture Overview

The Omnivore web application is a comprehensive Next.js-based reading and bookmarking platform built with modern React patterns. The system follows a modular architecture with clear separation of concerns:

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Web Application                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js Frontend (React + TypeScript)                      │
│  ├── Pages (SSR/SSG)                                        │
│  ├── Components (Reusable UI)                               │
│  ├── Templates (Page Layouts)                               │
│  └── Lib (Utilities & Hooks)                                │
├─────────────────────────────────────────────────────────────┤
│  API Layer (GraphQL + REST)                                 │
│  ├── GraphQL Client (TanStack Query)                        │
│  ├── Authentication                                         │
│  └── Data Fetching                                          │
├─────────────────────────────────────────────────────────────┤
│  Backend Services                                           │
│  ├── API Server                                             │
│  ├── Database                                               │
│  ├── Content Processing                                     │
│  └── External Integrations                                  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Core
- **Framework**: Next.js 13.5.6 (React 18.2.0)
- **Language**: TypeScript
- **Styling**: Stitches (CSS-in-JS) + CSS Modules
- **UI Components**: Radix UI primitives + custom components
- **Icons**: Phosphor Icons

### State Management & Data Fetching
- **Query Management**: TanStack Query (React Query) v5
- **Data Persistence**: AsyncStorage for client-side caching
- **GraphQL Client**: graphql-request
- **API Communication**: Axios for REST endpoints

### Development & Build Tools
- **Package Manager**: Yarn (Lerna monorepo)
- **Bundler**: Next.js built-in (Webpack)
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + Testing Library
- **Storybook**: Component development environment

### Advanced Features
- **Progressive Web App (PWA)**: Service worker support
- **Internationalization**: i18n support
- **Analytics**: Sentry error tracking
- **Performance**: Bundle analyzer, code splitting
- **Security**: CSP headers, sanitization

## Project Structure

```
packages/web/
├── components/           # Reusable UI components
│   ├── elements/        # Basic UI elements (buttons, inputs, etc.)
│   ├── patterns/        # Complex UI patterns (modals, cards, etc.)
│   ├── templates/       # Page-level templates
│   ├── nav-containers/  # Navigation-specific containers
│   └── tokens/          # Design system tokens
├── pages/               # Next.js pages (routing)
│   ├── api/            # API routes
│   ├── l/              # Library sections
│   ├── auth/           # Authentication pages
│   ├── settings/       # Settings pages
│   └── article/        # Article reader pages
├── lib/                 # Shared utilities and logic
│   ├── hooks/          # Custom React hooks
│   ├── networking/     # API layer and data fetching
│   ├── keyboardShortcuts/ # Keyboard shortcuts system
│   └── highlights/     # Highlight functionality
├── styles/             # Global styles and themes
├── public/             # Static assets
├── locales/            # Internationalization files
└── docs/               # Documentation
```

## Core Components

### Component Architecture
The component system follows a hierarchical structure:

1. **Elements** - Basic building blocks (Button, Input, Text)
2. **Patterns** - Composite components (Modal, Card, Navigation)
3. **Templates** - Page-level layouts
4. **Containers** - Data-connected components

### Key Component Categories

#### Elements (`components/elements/`)
- **Button**: Primary, secondary, and icon buttons
- **Input**: Text inputs, search bars, form controls
- **Layout Primitives**: Box, Stack, Grid components
- **Typography**: Styled text components
- **Icons**: Icon system integration

#### Patterns (`components/patterns/`)
- **LibraryCards**: Article display cards
- **ConfirmationModal**: User confirmation dialogs
- **KBar**: Command palette system
- **Navigation**: Menu and navigation components

#### Templates (`components/templates/`)
- **NavigationLayout**: Main app layout with sidebar
- **AuthLayout**: Authentication page layout
- **PrimaryLayout**: Standard page layout
- **ArticleReader**: Article reading interface

## Pages and Routing

### Next.js Routing Structure

The application uses Next.js file-based routing with the following main sections:

#### Core Pages
- `/` - Landing page
- `/login` - Authentication
- `/l/[section]` - Library sections (dynamic routing)
- `/article/[slug]` - Article reader
- `/settings/*` - Settings pages

#### Library Sections (`/l/[section]`)
- **home** - Recently saved articles
- **library** - All saved articles
- **archive** - Archived articles
- **highlights** - Highlighted content
- **subscriptions** - RSS/newsletter subscriptions
- **search** - Search functionality
- **trash** - Deleted items

#### URL Rewrites
Next.js rewrites provide clean URLs:
```javascript
/home → /l/home
/library → /l/library
/search → /l/search
// etc.
```

### Page Component Structure
```tsx
// Typical page structure
export default function PageComponent() {
  const router = useRouter()
  useApplyLocalTheme()
  
  return (
    <NavigationLayout>
      <PageContent />
    </NavigationLayout>
  )
}
```

## API Integration

### GraphQL Integration
- **Client**: graphql-request for GraphQL queries
- **Query Management**: TanStack Query for caching and state management
- **Type Generation**: GraphQL Code Generator for TypeScript types

### Key API Patterns
```typescript
// Custom hooks for data fetching
const { data, isLoading, error } = useGetLibraryItems({
  searchQuery,
  filters,
  sortBy
})

// Mutations for data updates
const archiveItem = useArchiveItem()
const deleteItem = useDeleteItem()
```

### Data Layer Structure
```
lib/networking/
├── queries/              # GraphQL queries
├── mutations/           # GraphQL mutations
├── fragments/           # Reusable GraphQL fragments
├── library_items/       # Library-specific API logic
└── hooks/               # Custom data-fetching hooks
```

## State Management

### Client State Management
- **TanStack Query**: Server state management and caching
- **React State**: Local component state with hooks
- **Persisted State**: Custom hook for localStorage/sessionStorage
- **URL State**: Router-based state management

### Key State Patterns
```typescript
// Persisted state
const [theme, setTheme] = usePersistedState({
  key: 'theme-preference',
  initialValue: 'light'
})

// Query state
const {
  data: libraryItems,
  fetchNextPage,
  hasNextPage
} = useInfiniteQuery({
  queryKey: ['library-items', filters],
  queryFn: fetchLibraryItems
})
```

## Authentication & Security

### Authentication System
- **JWT-based authentication**
- **Google OAuth integration**
- **Session management**
- **Protected routes**

### Security Features
- **Content Security Policy (CSP)**: Strict CSP headers
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token-based protection
- **Secure Headers**: Frame-ancestors, HTTPS enforcement

### CSP Configuration
```javascript
// Comprehensive CSP policy
const ContentSecurityPolicy = `
  default-src 'self';
  connect-src 'self' ${API_ENDPOINTS};
  script-src 'self' 'unsafe-inline' ${TRUSTED_SCRIPTS};
  // ... additional directives
`
```

## Build & Deployment

### Build Configuration
- **Next.js Configuration**: Custom webpack config
- **Bundle Analysis**: @next/bundle-analyzer
- **Environment Variables**: Multi-environment support
- **Asset Optimization**: Image optimization, code splitting

### Deployment Features
- **Static Site Generation (SSG)**: Pre-built pages
- **Server-Side Rendering (SSR)**: Dynamic content
- **CDN Integration**: Static asset delivery
- **Monitoring**: Sentry integration

### Environment Support
- **Local Development**: `yarn dev`
- **Production Build**: `yarn build`
- **Multiple Environments**: dev, demo, prod configurations

## Features Analysis for Lighter Version

### Core Features (Essential)
1. **Article Reading**: Basic article display and reading
2. **Library Management**: Save, organize, and search articles
3. **User Authentication**: Login and user management
4. **Basic UI**: Simple, clean interface

### Advanced Features (Could be Simplified/Removed)

#### High Impact Features (Large/Complex)
1. **Advanced Reader Features**
   - PDF support (pspdfkit, pdfjs-dist)
   - EPUB support (epubjs)
   - Text-to-speech
   - Advanced highlighting system
   - Reader customization (themes, fonts, layouts)

2. **Rich Text Editing**
   - Markdown editor (react-markdown-editor-lite)
   - Advanced note-taking
   - Collaborative editing features

3. **Advanced Search & Discovery**
   - Full-text search
   - AI-powered recommendations
   - Content discovery features
   - Advanced filtering and sorting

4. **Integrations**
   - RSS feed handling
   - Newsletter processing
   - Social media integrations
   - Third-party app connections

5. **PWA Features**
   - Offline reading
   - Service worker
   - Push notifications
   - App-like experience

#### Medium Impact Features
1. **Advanced UI Components**
   - Command palette (KBar)
   - Drag-and-drop functionality
   - Complex modals and overlays
   - Advanced data visualization

2. **Performance Optimizations**
   - Infinite scrolling
   - Virtual scrolling
   - Advanced caching
   - Bundle optimization

3. **Accessibility Features**
   - Screen reader support
   - Keyboard navigation
   - High contrast modes
   - Voice commands

#### Low Impact Features (Nice to Have)
1. **Theming System**: Multiple themes and customization
2. **Internationalization**: Multi-language support
3. **Analytics**: Detailed user analytics
4. **Storybook**: Component documentation
5. **Advanced Testing**: Comprehensive test suites

### Bundle Size Analysis

#### Large Dependencies (Could be Removed/Simplified)
- **pspdfkit**: ~2MB (PDF viewing)
- **pdfjs-dist**: ~1.5MB (PDF processing)
- **epubjs**: ~500KB (EPUB support)
- **@tanstack/react-query**: ~100KB (could use simpler state management)
- **antd**: ~500KB (could use lighter UI library)
- **react-markdown-editor-lite**: ~200KB (could use simpler editor)

#### Estimated Size Reduction
- **Current bundle size**: ~5-7MB (estimated)
- **Lighter version**: ~1-2MB (60-80% reduction possible)

## Recommendations

### For Creating a Lighter Version

#### 1. Simplify Reader Features
```typescript
// Instead of advanced PDF/EPUB support
// Use basic HTML article display only
const SimpleReader = ({ content }) => (
  <div className="article-content">
    <div dangerouslySetInnerHTML={{ __html: content }} />
  </div>
)
```

#### 2. Reduce Dependencies
```json
// Remove heavy dependencies
{
  "remove": [
    "pspdfkit",
    "pdfjs-dist", 
    "epubjs",
    "antd",
    "react-markdown-editor-lite"
  ],
  "replace": {
    "@tanstack/react-query": "swr", // Lighter alternative
    "kbar": "simple-command-palette"
  }
}
```

#### 3. Simplify Component Architecture
```
Simplified Structure:
├── components/
│   ├── ui/           # Basic UI components only
│   ├── layout/       # Simple layouts
│   └── article/      # Basic article components
├── pages/            # Reduced page count
├── lib/              # Essential utilities only
└── styles/           # Single theme, basic styles
```

#### 4. Core Features Only
- **Essential**: Article saving, reading, basic organization
- **Remove**: Advanced editing, complex search, integrations
- **Simplify**: Authentication (email/password only), basic theming

#### 5. Alternative Tech Stack (Optional)
For maximum lightness, consider:
- **Preact** instead of React (~3KB vs ~42KB)
- **Vanilla CSS** instead of CSS-in-JS
- **Basic fetch** instead of heavy query libraries
- **Static generation** instead of SSR where possible

### Implementation Strategy

1. **Phase 1**: Create minimal viable product with core features
2. **Phase 2**: Add essential features one by one
3. **Phase 3**: Optimize bundle size and performance
4. **Phase 4**: Add advanced features selectively based on user needs

### Expected Benefits of Lighter Version
- **Faster load times**: 3-5x improvement
- **Better mobile performance**: Reduced memory usage
- **Simpler maintenance**: Less complex codebase
- **Lower hosting costs**: Reduced bandwidth and computation
- **Improved accessibility**: Simpler UI is often more accessible

---

*This documentation provides a comprehensive overview of the Omnivore web system architecture and analysis for creating a lighter version. The current system is feature-rich but could be significantly simplified while maintaining core functionality.*
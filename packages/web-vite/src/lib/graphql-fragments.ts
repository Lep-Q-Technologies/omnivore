/**
 * GraphQL Fragments
 * Reusable field selections to reduce duplication and improve maintainability
 */

export const LABEL_FRAGMENT = `
  fragment LabelFields on Label {
    id
    name
    color
    description
    position
    internal
    createdAt
    updatedAt
  }
`

export const LABEL_BASIC_FRAGMENT = `
  fragment LabelBasicFields on Label {
    id
    name
    color
    description
    internal
  }
`

export const HIGHLIGHT_FRAGMENT = `
  fragment HighlightFields on Highlight {
    id
    shortId
    libraryItemId
    quote
    prefix
    suffix
    patch
    annotation
    createdAt
    updatedAt
    sharedAt
    highlightPositionPercent
    highlightPositionAnchorIndex
    highlightType
    html
    color
    representation
    selectors
    contentVersion
  }
`

export const HIGHLIGHT_WITH_ARTICLE_FRAGMENT = `
  fragment HighlightWithArticleFields on Highlight {
    id
    shortId
    libraryItemId
    quote
    prefix
    suffix
    patch
    annotation
    createdAt
    updatedAt
    sharedAt
    highlightPositionPercent
    color
    libraryItem {
      id
      title
      slug
      author
      siteName
      siteIcon
      originalUrl
      savedAt
      contentType
    }
  }
`

export const LIBRARY_ITEM_BASIC_FRAGMENT = `
  fragment LibraryItemBasicFields on LibraryItem {
    id
    title
    slug
    originalUrl
    author
    description
    savedAt
    createdAt
    updatedAt
    publishedAt
    readAt
    state
    contentReader
    folder
    thumbnail
    wordCount
    siteName
    siteIcon
    contentType
    itemType
    note
    noteUpdatedAt
    readingProgressPercent
    subscription {
      id
      title
      siteIcon
      feedUrl
    }
  }
`

export const LIBRARY_ITEM_FULL_FRAGMENT = `
  fragment LibraryItemFullFields on LibraryItem {
    id
    title
    slug
    originalUrl
    author
    description
    content
    savedAt
    createdAt
    updatedAt
    publishedAt
    readAt
    state
    contentReader
    folder
    thumbnail
    wordCount
    siteName
    siteIcon
    contentType
    itemType
    note
    noteUpdatedAt
    labels {
      ...LabelBasicFields
    }
  }
`

export const READING_PROGRESS_FRAGMENT = `
  fragment ReadingProgressFields on ReadingProgress {
    id
    libraryItemId
    contentVersion
    lastSeenSentinel
    highestSeenSentinel
    createdAt
    updatedAt
  }
`

export const RSS_FEED_FRAGMENT = `
  fragment RssFeedFields on RssFeed {
    id
    feedUrl
    title
    description
    siteUrl
    siteIcon
    lastFetchedAt
    itemCount
    unreadCount
    active
    lastError
    failureCount
    createdAt
    updatedAt
  }
`


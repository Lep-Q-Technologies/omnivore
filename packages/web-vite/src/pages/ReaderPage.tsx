// Reader page component for Omnivore Vite migration

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  useLibraryItem,
  useHighlights,
  useReadingProgress,
  useUpdateReadingProgress as useUpdateReadingProgressMutation,
  useLabels,
  useCreateHighlight,
  useUpdateHighlight,
  useDeleteHighlight,
  useUpdateNotebook,
  type CreateHighlightInput,
} from '../lib/graphql-client'
import {
  useAnchoredHighlights,
  buildSelectorsFromSelection,
  type AnchoredHighlight,
} from '../lib/anchoredHighlights'
import { generateContentHashWithFallback } from '../lib/contentHash'
import LabelPickerModal from '../components/LabelPickerModal'
import EditInfoModal from '../components/EditInfoModal'
import HighlightSidebar from '../components/HighlightSidebar'
import NotebookModal from '../components/NotebookModal'
import type { Label, AnchoredSelectors, HighlightColor } from '../types/api'
// CSS imported via consolidated bundle in main.tsx

// Popup component for creating new highlights
const CreateHighlightPopup: React.FC<{
  selectedText: string
  position: { top: number; left: number }
  onCreateHighlight: (color: HighlightColor, annotation: string) => void
  onClose: () => void
}> = ({ selectedText, position, onCreateHighlight, onClose }) => {
  const [annotation, setAnnotation] = useState('')
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('YELLOW')
  const [showAnnotationInput, setShowAnnotationInput] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  const colors: Array<{ name: HighlightColor; label: string; bg: string }> = [
    { name: 'YELLOW', label: 'General', bg: 'rgba(255, 212, 59, 0.5)' },
    { name: 'RED', label: 'Important', bg: 'rgba(255, 107, 107, 0.5)' },
    { name: 'GREEN', label: 'Action', bg: 'rgba(85, 239, 196, 0.5)' },
    { name: 'BLUE', label: 'Reference', bg: 'rgba(116, 185, 255, 0.5)' },
  ]

  const handleSave = () => {
    onCreateHighlight(selectedColor, annotation)
  }

  return (
    <div
      ref={popupRef}
      className="create-highlight-popup"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="popup-header">
        <span className="popup-title">Create Highlight</span>
        <button
          type="button"
          className="popup-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="color-picker">
        {colors.map((color) => (
          <button
            key={color.name}
            type="button"
            className={`color-button ${selectedColor === color.name ? 'active' : ''}`}
            style={{ backgroundColor: color.bg }}
            onClick={() => setSelectedColor(color.name)}
            title={color.label}
          >
            <span className="color-label">{color.label}</span>
          </button>
        ))}
      </div>

      {!showAnnotationInput ? (
        <button
          type="button"
          className="add-note-button"
          onClick={() => setShowAnnotationInput(true)}
        >
          + Add note
        </button>
      ) : (
        <div className="annotation-input-container">
          <textarea
            className="annotation-textarea"
            placeholder="Add your thoughts..."
            value={annotation}
            onChange={(e) => {
              setAnnotation(e.target.value)
            }}
            autoFocus
            rows={3}
          />
        </div>
      )}

      <div className="selected-text-preview">
        "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
      </div>

      <button
        type="button"
        className="save-highlight-button"
        onClick={handleSave}
      >
        Save Highlight
      </button>
    </div>
  )
}

const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Fetch item and highlights separately but in PARALLEL
  const {
    data: item,
    loading: itemLoading,
    error: itemError,
    fetchLibraryItem,
  } = useLibraryItem(id || '')
  const {
    data: highlights,
    loading: highlightsLoading,
    fetchHighlights,
  } = useHighlights(id || '')

  // Combined loading/error states
  const loading = itemLoading || highlightsLoading
  const error = itemError

  const { fetchLabels } = useLabels()
  const { createHighlight } = useCreateHighlight()
  const { updateHighlight } = useUpdateHighlight()
  const { deleteHighlight } = useDeleteHighlight()
  const { updateNotebook } = useUpdateNotebook()
  
  // Sentinel-based reading progress state
  const [contentHash, setContentHash] = useState<string | null>(null)
  const [currentSentinel, setCurrentSentinel] = useState(0)
  const [highestSentinel, setHighestSentinel] = useState(0)
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false)
  const sentinelUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelsInjectedRef = useRef(false)
  const lastObserverUpdateRef = useRef<number>(0)
  
  const {
    data: readingProgress,
    fetchProgress,
  } = useReadingProgress(id || '', contentHash || undefined)
  const { updateProgress: updateReadingProgress } = useUpdateReadingProgressMutation()
  
  const [showLabelModal, setShowLabelModal] = useState(false)
  const [showEditInfoModal, setShowEditInfoModal] = useState(false)
  const [showHighlightSidebar, setShowHighlightSidebar] = useState(false)
  const [showNotebookModal, setShowNotebookModal] = useState(false)
  const [itemLabels, setItemLabels] = useState<Label[]>([])
  const [selectedText, setSelectedText] = useState<string>('')
  const [showCreatePopup, setShowCreatePopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const savedSelectionRef = useRef<{ range: Range; text: string } | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Fetch item and highlights in PARALLEL (not sequential!)
  useEffect(() => {
    if (id) {
      // Fire both requests simultaneously
      Promise.all([
        fetchLibraryItem(),
        fetchHighlights(),
      ]).catch(err => {
        console.error('[ReaderPage] Failed to fetch data:', err)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]) // Only re-fetch when ID changes, not when callbacks change

  // Fetch labels once on mount (needed globally)
  useEffect(() => {
    fetchLabels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only fetch once on mount

  // Update local labels when item loads
  useEffect(() => {
    if (item?.labels) {
      setItemLabels(item.labels)
    }
  }, [item])

  // Convert highlights to anchored format for the hook
  // CRITICAL: Stringify to create stable reference based on actual data
  const highlightsJson = useMemo(() => JSON.stringify(highlights), [highlights])

  const anchoredHighlights = useMemo<AnchoredHighlight[]>(() => {
    const parsed = JSON.parse(highlightsJson || '[]')
    if (!parsed || parsed.length === 0) return []
    return parsed.map((h: any) => {
      // Parse selectors from backend, fallback to legacy quote/prefix/suffix
      let selectors: AnchoredSelectors
      if (h.selectors) {
        try {
          selectors = JSON.parse(h.selectors)
        } catch {
          // Fallback to legacy fields if JSON parsing fails
          selectors = {
            textQuote: {
              exact: h.quote || '',
              prefix: h.prefix || undefined,
              suffix: h.suffix || undefined,
            },
          }
        }
      } else {
        // Legacy highlight without selectors field
        selectors = {
          textQuote: {
            exact: h.quote || '',
            prefix: h.prefix || undefined,
            suffix: h.suffix || undefined,
          },
        }
      }

      return {
        id: h.id,
        color: h.color,
        annotation: h.annotation || undefined,
        selectors,
      }
    })
  }, [highlightsJson])

  // Apply anchored highlights to content
  const { jumpTo, reapply } = useAnchoredHighlights(contentRef, anchoredHighlights)

  // Generate content hash when content loads
  useEffect(() => {
    if (!item?.content) return

    const generateHash = async () => {
      const hash = await generateContentHashWithFallback(item.content || '')
      setContentHash(hash)
      // Reset sentinel injection flag when content hash changes
      sentinelsInjectedRef.current = false
    }

    generateHash()
  }, [item?.content])

  // Fetch reading progress when content hash is available
  useEffect(() => {
    if (id && contentHash) {
      fetchProgress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, contentHash]) // Only re-fetch when ID or content hash changes

  // Inject sentinels into content - DEFERRED: Uses requestIdleCallback to prevent blocking
  useEffect(() => {
    // Don't inject sentinels while still loading data
    if (loading || !contentRef.current || !item?.content || sentinelsInjectedRef.current) return

    const container = contentRef.current

    // Defer sentinel injection until browser is idle (don't block interaction)
    const idleCallback = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 100))

    const handle = idleCallback(() => {
      if (!container || sentinelsInjectedRef.current) return

      // Find all block elements where we can inject sentinels
      const blockElements = container.querySelectorAll(
        'p, h1, h2, h3, h4, h5, h6, blockquote, pre, li, div.article-content > div'
      )

      let sentinelIndex = 0

      blockElements.forEach((element) => {
        // Skip if this element already has a sentinel after it
        if (element.nextElementSibling?.hasAttribute('data-sentinel')) {
          sentinelIndex++
          return
        }

        // Create invisible sentinel marker
        const sentinel = document.createElement('div')
        sentinel.setAttribute('data-sentinel', String(sentinelIndex))
        sentinel.style.cssText = 'height:0;overflow:hidden;pointer-events:none;'

        // Insert after the block element
        element.after(sentinel)
        sentinelIndex++
      })

      sentinelsInjectedRef.current = true
      console.log(`[ReadingProgress] Injected ${sentinelIndex} sentinels (deferred, non-blocking)`)
    }, { timeout: 3000 }) // Longer timeout - let page become interactive first

    return () => {
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(handle)
      } else {
        clearTimeout(handle)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.content, contentHash, loading]) // Re-run when content or loading state changes

  // Setup IntersectionObserver to track sentinel visibility - OPTIMIZED
  useEffect(() => {
    if (!contentRef.current || !id || !contentHash || !sentinelsInjectedRef.current) return

    // Only create observer once, reuse across re-renders
    if (observerRef.current) {
      // Re-attach to new sentinels if content changed
      const sentinels = contentRef.current.querySelectorAll('[data-sentinel]')
      sentinels.forEach((sentinel) => observerRef.current!.observe(sentinel))
      return
    }

    // Create new observer with throttled callback
    const observer = new IntersectionObserver(
      (entries) => {
        // Throttle updates to max 10 per second (100ms intervals)
        const now = Date.now()
        if (now - lastObserverUpdateRef.current < 100) return
        lastObserverUpdateRef.current = now

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sentinelId = Number(entry.target.getAttribute('data-sentinel'))
            if (!isNaN(sentinelId)) {
              setCurrentSentinel(sentinelId)
              setHighestSentinel((prev) => Math.max(prev, sentinelId))
            }
          }
        })
      },
      {
        // Trigger when sentinel enters top 10% of viewport
        threshold: 0,
        rootMargin: '-10% 0px -90% 0px',
      }
    )

    // Observe all sentinels
    const sentinels = contentRef.current.querySelectorAll('[data-sentinel]')
    sentinels.forEach((sentinel) => observer.observe(sentinel))

    observerRef.current = observer
    console.log(`[ReadingProgress] Observer attached to ${sentinels.length} sentinels`)

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [id, contentHash, sentinelsInjectedRef.current])

  // Debounced update of reading progress
  useEffect(() => {
    if (!id || !contentHash || currentSentinel === 0) return

    // Clear existing timeout
    if (sentinelUpdateTimeoutRef.current) {
      clearTimeout(sentinelUpdateTimeoutRef.current)
    }

    // Debounce: Update progress 2 seconds after user stops scrolling
    sentinelUpdateTimeoutRef.current = setTimeout(() => {
      updateReadingProgress({
        libraryItemId: id,
        contentVersion: contentHash,
        lastSeenSentinel: currentSentinel,
        highestSeenSentinel: highestSentinel,
      }).catch((error) => {
        console.error('[ReadingProgress] Failed to update:', error)
      })
    }, 2000)

    return () => {
      if (sentinelUpdateTimeoutRef.current) {
        clearTimeout(sentinelUpdateTimeoutRef.current)
      }
    }
  }, [id, contentHash, currentSentinel, highestSentinel, updateReadingProgress])

  // Restore scroll position from saved progress
  useEffect(() => {
    if (
      !readingProgress ||
      !contentRef.current ||
      hasRestoredPosition ||
      !item?.content
    ) {
      return
    }

    const targetSentinel = contentRef.current.querySelector(
      `[data-sentinel="${readingProgress.lastSeenSentinel}"]`
    )

    if (targetSentinel) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        targetSentinel.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setHasRestoredPosition(true)
        console.log(
          `[ReadingProgress] Restored position to sentinel ${readingProgress.lastSeenSentinel}`
        )
      }, 100)
    } else {
      setHasRestoredPosition(true)
    }
  }, [readingProgress, hasRestoredPosition, item?.content])

  const handleBack = () => {
    navigate('/home')
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleLabelsUpdate = async (newLabelNames: string[]) => {
    console.log('[ReaderPage] handleLabelsUpdate called with:', newLabelNames)

    // NOTE: The LabelPickerModal has already called setLibraryItemLabels() successfully
    // We just need to update the local UI state and refetch to get the latest data

    setShowLabelModal(false)

    // Refetch both labels and the item to ensure we have the latest data
    await fetchLabels()
    await fetchLibraryItem()

    console.log('[ReaderPage] Refetched item after label update')
  }

  const handleInfoUpdate = async () => {
    // Refetch item to get updated info from server
    await fetchLibraryItem()
  }

  // No longer needed - images are optimized via DOMPurify hooks below

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.create-highlight-popup')) {
        setShowCreatePopup(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Text selection detection
  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection()
        const contentElement = contentRef.current

        if (!selection || selection.isCollapsed) {
          return
        }

        if (!contentElement) {
          return
        }

        const text = selection.toString().trim()

        // Save the selection range BEFORE showing the popup
        // This prevents losing the selection when user clicks into the textarea
        if (selection.rangeCount > 0) {
          savedSelectionRef.current = {
            range: selection.getRangeAt(0).cloneRange(),
            text: text
          }
          console.log('[ReaderPage] Saved selection:', text.substring(0, 50) + '...')
        }

        if (text.length < 3) {
          return
        }

        // Check if selection is within the content area
        const range = selection.getRangeAt(0)
        const isInContent = contentElement.contains(range.commonAncestorContainer)

        if (!isInContent) {
          return
        }

        // Get selection position for popup
        const rect = range.getBoundingClientRect()

        setSelectedText(text)
        setPopupPosition({
          top: rect.top + window.scrollY - 120, // Position above selection
          left: Math.max(10, rect.left + rect.width / 2 - 150), // Center popup with min left margin
        })
        setShowCreatePopup(true)
      }, 10)
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // Create highlight handler
  const handleCreateHighlight = async (
    color: HighlightColor,
    annotation: string
  ) => {
    if (!id || !contentRef.current) return

    try {
      // Use saved selection instead of window.getSelection()
      // The selection gets cleared when user clicks into the annotation textarea
      const savedSelection = savedSelectionRef.current
      if (!savedSelection) {
        console.error('[ReaderPage] No saved selection found')
        return
      }

      console.log('[ReaderPage] Using saved selection:', savedSelection.text.substring(0, 50) + '...')

      // Create a temporary selection object to pass to buildSelectorsFromSelection
      const tempSelection = {
        rangeCount: 1,
        getRangeAt: (index: number) => savedSelection.range,
        toString: () => savedSelection.text
      } as Selection

      // Build robust anchored selectors (DOM Range, TextPosition, TextQuote)
      const selectors = buildSelectorsFromSelection(tempSelection, contentRef.current)

      // Calculate position percentage (0-100)
      const docHeight = document.documentElement.scrollHeight
      const range = savedSelection.range
      const selectionTop = range.getBoundingClientRect().top + window.scrollY
      const positionPercent = docHeight > 0 ? Math.min(100, Math.max(0, (selectionTop / docHeight) * 100)) : 0

      const input: CreateHighlightInput = {
        libraryItemId: id,
        quote: selectors.textQuote?.exact || '',
        annotation: annotation || undefined,
        color,
        prefix: selectors.textQuote?.prefix,
        suffix: selectors.textQuote?.suffix,
        highlightPositionPercent: Math.round(positionPercent * 100) / 100,
        highlightPositionAnchorIndex: 0,
        // Serialize anchored selectors for backend storage
        selectors: JSON.stringify(selectors),
      }

      console.log('[ReaderPage] Creating highlight with input:', {
        annotation: input.annotation,
        color: input.color,
        quoteLength: input.quote.length
      })

      const result = await createHighlight(input)
      console.log('[ReaderPage] Highlight created:', result)

      // Refetch highlights to update UI
      await fetchHighlights()

      // Close popup first to allow DOM to settle
      setShowCreatePopup(false)
      setSelectedText('')
      savedSelectionRef.current = null // Clear saved selection
      window.getSelection()?.removeAllRanges() // Clear any remaining selection

      // Manually reapply highlights after state updates (longer delay)
      setTimeout(() => {
        console.log('[ReaderPage] Reapplying highlights after creation')
        reapply()
      }, 500)
    } catch (error) {
      console.error('Failed to create highlight:', error)
      // Show error to user - you could add a toast notification here
      alert('Failed to create highlight. Please try again.')
    }
  }

  // Update highlight handler
  const handleUpdateHighlight = async (
    highlightId: string,
    annotation: string,
    color: HighlightColor
  ) => {
    try {
      await updateHighlight(highlightId, { annotation, color })
      await fetchHighlights()
      // Manually reapply highlights since MutationObserver is disabled
      setTimeout(() => {
        console.log('[ReaderPage] Reapplying highlights after update')
        reapply()
      }, 500)
    } catch (error) {
      console.error('Failed to update highlight:', error)
    }
  }

  // Delete highlight handler
  const handleDeleteHighlight = async (highlightId: string) => {
    try {
      await deleteHighlight(highlightId)
      await fetchHighlights()
      // Manually reapply highlights since MutationObserver is disabled
      setTimeout(() => {
        console.log('[ReaderPage] Reapplying highlights after delete')
        reapply()
      }, 500)
    } catch (error) {
      console.error('Failed to delete highlight:', error)
    }
  }

  // Jump to highlight handler - now uses the robust anchored highlights hook
  const handleJumpToHighlight = (highlightId: string) => {
    jumpTo(highlightId)
  }

  // Notebook save handler
  const handleNotebookSave = async (note: string) => {
    if (!id) return

    try {
      await updateNotebook(id, note)
      // Refetch item to get updated note timestamp
      await fetchLibraryItem()
    } catch (error) {
      console.error('Failed to save notebook:', error)
      throw error // Re-throw so NotebookModal can handle the error
    }
  }

  // Sanitize HTML content with image optimization hooks - MUST BE BEFORE EARLY RETURNS
  const sanitizedContent = useMemo(() => {
    if (!item?.content) return ''

    // Configure DOMPurify to add lazy loading and async decoding to ALL images
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'IMG') {
        // Add lazy loading (prevents immediate loading)
        node.setAttribute('loading', 'lazy')
        // Add async decoding (prevents main thread blocking)
        node.setAttribute('decoding', 'async')
        // Hide broken images
        node.setAttribute('onerror', 'this.style.display="none"')
      }
    })

    const result = DOMPurify.sanitize(item.content, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading', 'decoding', 'onerror'],
    })

    // Clean up hooks after use
    DOMPurify.removeAllHooks()

    return result
  }, [item?.content])

  // Get user labels (non-internal) - use local state for optimistic updates
  const userLabels = useMemo(() => {
    return itemLabels.filter((label) => !label.internal)
  }, [itemLabels])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // 'l' key to open labels modal
      if (e.key === 'l' && !showLabelModal && !showEditInfoModal && !showHighlightSidebar && !showNotebookModal) {
        e.preventDefault()
        setShowLabelModal(true)
      }

      // 'e' key to open edit info modal
      if (e.key === 'e' && !showEditInfoModal && !showLabelModal && !showHighlightSidebar && !showNotebookModal) {
        e.preventDefault()
        setShowEditInfoModal(true)
      }

      // 'h' key to toggle highlight sidebar
      if (e.key === 'h' && !showEditInfoModal && !showLabelModal && !showNotebookModal) {
        e.preventDefault()
        setShowHighlightSidebar(!showHighlightSidebar)
      }

      // 'n' key to open notebook modal
      if (e.key === 'n' && !showEditInfoModal && !showLabelModal && !showHighlightSidebar && !showNotebookModal) {
        e.preventDefault()
        setShowNotebookModal(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showLabelModal, showEditInfoModal, showHighlightSidebar, showNotebookModal])

  // Loading state
  if (loading) {
    return (
      <div className="reader-page">
        <div className="reader-loading">
          <div className="spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="reader-page">
        <div className="reader-error">
          <h2>Error Loading Article</h2>
          <p>{error.message}</p>
          <button type="button" onClick={handleBack} className="back-button">
            ← Back to Library
          </button>
        </div>
      </div>
    )
  }

  // Not found state
  if (!item) {
    return (
      <div className="reader-page">
        <div className="reader-error">
          <h2>Article Not Found</h2>
          <p>
            The article you're looking for doesn't exist or has been deleted.
          </p>
          <button type="button" onClick={handleBack} className="back-button">
            ← Back to Library
          </button>
        </div>
      </div>
    )
  }

  // Content not fetched state
  if (item.state === 'CONTENT_NOT_FETCHED' || !item.content) {
    return (
      <div className="reader-page">
        <div className="reader-header">
          <button type="button" onClick={handleBack} className="back-button">
            ← Back to Library
          </button>
          <h1>{item.title}</h1>
          {item.author && <p className="author">By {item.author}</p>}
          {item.publishedAt && (
            <p className="publish-date">{formatDate(item.publishedAt)}</p>
          )}
          {item.originalUrl && (
            <a
              href={item.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="original-link"
            >
              View Original →
            </a>
          )}
        </div>
        <div className="reader-content-empty">
          <div className="empty-state">
            <h2>Content Not Available</h2>
            <p>
              This article's content is being processed. Please check back in a
              moment.
            </p>
            <p className="state-info">Status: {item.state}</p>
            <a
              href={item.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="view-original-button"
            >
              View Original Article
            </a>
          </div>
        </div>
      </div>
    )
  }

  // sanitizedContent and userLabels already computed above (before early returns)

  return (
    <div className="reader-page">
      <div className="reader-header">
        <button type="button" onClick={handleBack} className="back-button">
          ← Back to Library
        </button>
        <h1>{item.title}</h1>
        {item.author && <p className="author">By {item.author}</p>}
        {item.publishedAt && (
          <p className="publish-date">{formatDate(item.publishedAt)}</p>
        )}

        {/* Labels display - read-only chips */}
        {userLabels.length > 0 && (
          <div className="reader-labels">
            {userLabels.map((label) => (
              <span
                key={label.id}
                className="reader-label-chip"
                style={{ backgroundColor: label.color }}
              >
                <svg
                  aria-hidden="true"
                  className="label-chip-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="none"
                >
                  <circle cx="12" cy="12" r="12" />
                </svg>
                {label.name}
              </span>
            ))}
          </div>
        )}

        {item.originalUrl && (
          <a
            href={item.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="original-link"
          >
            View Original →
          </a>
        )}

        {/* Toolbar with label edit button */}
        <div className="reader-toolbar">
          <button
            type="button"
            className="toolbar-button"
            onClick={() => setShowHighlightSidebar(!showHighlightSidebar)}
            title="Highlights (h)"
            aria-label="View highlights"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <title>Highlight icon</title>
              <path d="M12 20 h9" />
              <path d="M16.5 3.5 a2.121 2.121 0 0 1 3 3 L7 19 l-4 1 l1 -4 L16.5 3.5 z" />
            </svg>
            <span>Highlights {highlights && highlights.length > 0 ? `(${highlights.length})` : ''}</span>
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => setShowLabelModal(true)}
            title="Edit labels (l)"
            aria-label="Edit labels"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <title>Label icon</title>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            <span>Labels</span>
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => setShowEditInfoModal(true)}
            title="Edit info (e)"
            aria-label="Edit article information"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <title>Edit icon</title>
              <path d="M11 4 H4 a2 2 0 0 0 -2 2 v14 a2 2 0 0 0 2 2 h14 a2 2 0 0 0 2 -2 v-7"></path>
              <path d="M18.5 2.5 a2.121 2.121 0 0 1 3 3 L12 15 l-4 1 l1 -4 l9.5 -9.5 z"></path>
            </svg>
            <span>Edit Info</span>
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => setShowNotebookModal(true)}
            title="Notebook (n)"
            aria-label="Open notebook"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <title>Notebook icon</title>
              <path d="M2 6 a2 2 0 0 1 2 -2 h16 a2 2 0 0 1 2 2 v12 a2 2 0 0 1 -2 2 H4 a2 2 0 0 1 -2 -2 Z"></path>
              <path d="M8 2 v20"></path>
            </svg>
            <span>Notebook</span>
          </button>
        </div>
      </div>

      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: content sanitized with DOMPurify above */}
      <div
        ref={contentRef}
        className="reader-content"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {/* Create highlight popup */}
      {showCreatePopup && selectedText && (
        <CreateHighlightPopup
          selectedText={selectedText}
          position={popupPosition}
          onCreateHighlight={handleCreateHighlight}
          onClose={() => {
            setShowCreatePopup(false)
            setSelectedText('')
            window.getSelection()?.removeAllRanges()
          }}
        />
      )}

      {/* Label picker modal */}
      {showLabelModal && item && (
        <LabelPickerModal
          itemId={item.id}
          currentLabels={itemLabels.map((l) => l.name)}
          onUpdate={handleLabelsUpdate}
          onClose={() => setShowLabelModal(false)}
        />
      )}

      {/* Edit info modal */}
      {showEditInfoModal && item && (
        <EditInfoModal
          itemId={item.id}
          currentTitle={item.title}
          currentAuthor={item.author}
          currentDescription={item.description}
          onUpdate={handleInfoUpdate}
          onClose={() => setShowEditInfoModal(false)}
        />
      )}

      {/* Highlight Sidebar */}
      {showHighlightSidebar && highlights && (
        <HighlightSidebar
          highlights={highlights}
          onUpdateHighlight={handleUpdateHighlight}
          onDeleteHighlight={handleDeleteHighlight}
          onJumpToHighlight={handleJumpToHighlight}
          onClose={() => setShowHighlightSidebar(false)}
        />
      )}

      {/* Notebook Modal */}
      {showNotebookModal && item && (
        <NotebookModal
          itemTitle={item.title}
          currentNote={item.note}
          onSave={handleNotebookSave}
          onClose={() => setShowNotebookModal(false)}
        />
      )}
    </div>
  )
}

export default ReaderPage

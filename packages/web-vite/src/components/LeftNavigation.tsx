// Left navigation panel component - matches legacy Omnivore UI
// Features: Main nav (Home, Library, Highlights, etc.) + RSS Subscriptions + Shortcuts section

import '../styles/LeftNavigation.css'

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  useRssFeeds,
  type RssFeed,
  graphqlRequest,
} from '../lib/graphql-client'
import {
  LibraryIcon,
  HighlightsIcon,
  LabelIcon,
  FollowingIcon,
  InboxIcon,
  ArchiveIcon,
  TrashIcon,
} from './icons'

const UNSUBSCRIBE_FROM_RSS_FEED = `
  mutation UnsubscribeFromRssFeed($feedId: ID!, $deleteItems: Boolean) {
    unsubscribeFromRssFeed(feedId: $feedId, deleteItems: $deleteItems) {
      success
      message
      errors
    }
  }
`

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  count?: number
}

interface ShortcutItem {
  id: string
  label: string
  icon: React.ReactNode
  filter?: string
}

const LeftNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isShortcutsExpanded, setIsShortcutsExpanded] = useState(true)
  const [isSubscriptionsExpanded, setIsSubscriptionsExpanded] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Fetch RSS feeds
  const { data: feeds, fetchFeeds } = useRssFeeds(true)

  useEffect(() => {
    fetchFeeds().catch((error) => {
      console.error('Failed to fetch RSS feeds:', error)
    })
  }, [fetchFeeds])

  const mainNavItems = [
    {
      icon: <LibraryIcon className="nav-icon" />,
      label: 'Library',
      path: '/home',
      id: 'library',
    },
    {
      icon: <HighlightsIcon className="nav-icon" />,
      label: 'Highlights',
      path: '/highlights',
      id: 'highlights',
    },
    {
      icon: <LabelIcon className="nav-icon" />,
      label: 'Labels',
      path: '/labels',
      id: 'labels',
    },
    {
      icon: <FollowingIcon className="nav-icon" />,
      label: 'Following',
      path: '/home?filter=following',
      id: 'following',
    },
  ]

  const quickFilters: ShortcutItem[] = [
    { id: 'inbox', label: 'Inbox', icon: <InboxIcon />, filter: 'inbox' },
    {
      id: 'archive',
      label: 'Archive',
      icon: <ArchiveIcon />,
      filter: 'archive',
    },
    { id: 'trash', label: 'Trash', icon: <TrashIcon />, filter: 'trash' },
  ]

  const isActive = (path: string): boolean => {
    const [pathname, search] = path.split('?')
    if (search) {
      return location.pathname === pathname && location.search === `?${search}`
    }
    // Special case for Library (home without filter)
    if (path === '/home') {
      return (
        location.pathname === '/home' &&
        (!location.search || location.search === '')
      )
    }

    return location.pathname === path
  }

  const handleNavClick = (path: string) => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  const handleQuickFilterClick = (filter: string) => {
    // Navigate to home with query param
    navigate(`/home?filter=${filter}`)
    setIsMobileMenuOpen(false)
  }

  const handleFeedClick = (feedId?: string) => {
    // Navigate to following folder with optional feed filter
    if (feedId) {
      navigate(`/home?filter=following&feedId=${feedId}`)
    } else {
      // Show all RSS items from all feeds
      navigate('/home?filter=following')
    }
    setIsMobileMenuOpen(false)
  }

  const handleUnsubscribeFeed = async (feedId: string, feedTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to unsubscribe from "${feedTitle}"?\n\nThis will delete the subscription and all articles from this feed in your library.`,
    )

    if (!confirmed) return

    try {
      const result = await graphqlRequest<{
        unsubscribeFromRssFeed: {
          success: boolean
          message: string
          errors?: string[]
        }
      }>(UNSUBSCRIBE_FROM_RSS_FEED, {
        feedId,
        deleteItems: true,
      })

      if (result.unsubscribeFromRssFeed.success) {
        // Refetch feeds to update the sidebar
        await fetchFeeds()
        // Navigate to home if we were viewing this feed
        if (location.search.includes(`feedId=${feedId}`)) {
          navigate('/home')
        }
      } else {
        alert(
          `Failed to unsubscribe: ${
            result.unsubscribeFromRssFeed.errors?.join(', ') ||
            result.unsubscribeFromRssFeed.message
          }`,
        )
      }
    } catch (error) {
      console.error('Error unsubscribing from feed:', error)
      alert('Failed to unsubscribe from feed. Please try again.')
    }
  }

  return (
    <>
      {/* Mobile menu toggle button */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        ☰
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="nav-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left navigation panel */}
      <nav className={`left-navigation ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Close button for mobile */}
        <button
          className="nav-close-btn"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close navigation menu"
        >
          ✕
        </button>

        {/* Main navigation items */}
        <div className="nav-section main-nav">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.count !== undefined && (
                <span className="nav-count">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* RSS Subscriptions section */}
        <div className="nav-section shortcuts-section">
          <div className="shortcuts-header">
            <h3 className="shortcuts-title">Subscriptions</h3>
            <button
              className="shortcuts-toggle"
              onClick={() =>
                setIsSubscriptionsExpanded(!isSubscriptionsExpanded)
              }
              aria-label={
                isSubscriptionsExpanded
                  ? 'Collapse subscriptions'
                  : 'Expand subscriptions'
              }
            >
              {isSubscriptionsExpanded ? '−' : '+'}
            </button>
          </div>

          {isSubscriptionsExpanded && (
            <div className="shortcuts-list">
              {/* Individual feeds */}
              {feeds && feeds.length > 0 ? (
                feeds.map((feed) => (
                  <div key={feed.id} className="feed-item-container">
                    <button
                      className="shortcut-item feed-item"
                      onClick={() => handleFeedClick(feed.id)}
                      title={feed.title || feed.feedUrl}
                    >
                      <span className="shortcut-icon">
                        {feed.siteIcon ? (
                          <img
                            src={feed.siteIcon}
                            alt=""
                            className="shortcut-icon-img"
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '2px',
                            }}
                          />
                        ) : (
                          <FollowingIcon size={16} />
                        )}
                      </span>
                      <span className="shortcut-label">
                        {feed.title || 'Untitled Feed'}
                      </span>
                      {feed.unreadCount !== undefined &&
                        feed.unreadCount !== null &&
                        feed.unreadCount > 0 && (
                          <span className="feed-unread-count">
                            {feed.unreadCount}
                          </span>
                        )}
                    </button>
                    <button
                      className="feed-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnsubscribeFeed(
                          feed.id,
                          feed.title || feed.feedUrl,
                        )
                      }}
                      title="Unsubscribe from this feed"
                      aria-label={`Unsubscribe from ${feed.title || 'feed'}`}
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div
                  className="empty-feeds-message"
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: '#888',
                  }}
                >
                  No subscriptions yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Filters section */}
        <div className="nav-section shortcuts-section">
          <div className="shortcuts-header">
            <h3 className="shortcuts-title">Quick Filters</h3>
            <button
              className="shortcuts-toggle"
              onClick={() => setIsShortcutsExpanded(!isShortcutsExpanded)}
              aria-label={
                isShortcutsExpanded ? 'Collapse filters' : 'Expand filters'
              }
            >
              {isShortcutsExpanded ? '−' : '+'}
            </button>
          </div>

          {isShortcutsExpanded && (
            <div className="shortcuts-list">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  className="shortcut-item"
                  onClick={() => handleQuickFilterClick(filter.filter || '')}
                  title={filter.label}
                >
                  <span className="shortcut-icon">{filter.icon}</span>
                  <span className="shortcut-label">{filter.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="nav-footer">
          <div className="nav-footer-text">Omnivore</div>
        </div>
      </nav>
    </>
  )
}

export default LeftNavigation

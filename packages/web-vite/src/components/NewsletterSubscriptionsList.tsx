import React, { useEffect, useState } from 'react'

import type { NewsletterSubscription } from '../types/api'
import {
  useNewsletterSubscriptions,
  useUnsubscribeFromNewsletter,
} from '../lib/graphql-client'

interface NewsletterSubscriptionsListProps {
  onEditSettings?: (subscription: NewsletterSubscription) => void
}

const NewsletterSubscriptionsList: React.FC<
  NewsletterSubscriptionsListProps
> = ({ onEditSettings }) => {
  const {
    data: subscriptions,
    loading,
    error,
    fetchNewsletterSubscriptions,
  } = useNewsletterSubscriptions(true)
  const { unsubscribe, loading: unsubscribing } =
    useUnsubscribeFromNewsletter()
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null)
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null)

  useEffect(() => {
    fetchNewsletterSubscriptions()
  }, [fetchNewsletterSubscriptions])

  const handleUnsubscribe = async (
    subscriptionId: string,
    senderEmail: string,
  ) => {
    const confirmMessage = `Are you sure you want to unsubscribe from ${senderEmail}? This will also delete all items from this newsletter.`
    if (!window.confirm(confirmMessage)) {
      return
    }

    setUnsubscribingId(subscriptionId)
    try {
      await unsubscribe(subscriptionId, true)
      // Refresh the list after unsubscribing
      await fetchNewsletterSubscriptions()
    } catch (err) {
      console.error('Failed to unsubscribe:', err)
      alert('Failed to unsubscribe. Please try again.')
    } finally {
      setUnsubscribingId(null)
    }
  }

  const handleCopyEmail = async (subscriptionId: string, email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmailId(subscriptionId)
      setTimeout(() => setCopiedEmailId(null), 2000)
    } catch (err) {
      console.error('Failed to copy email:', err)
    }
  }

  if (loading) {
    return (
      <div className="newsletter-subscriptions-list loading">
        <p>Loading newsletter subscriptions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="newsletter-subscriptions-list error">
        <p>Error loading subscriptions: {error.message}</p>
      </div>
    )
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="newsletter-subscriptions-list empty">
        <p>No newsletter subscriptions yet.</p>
        <p className="empty-hint">
          Forward a newsletter to your Omnivore email address to start subscribing.
        </p>
      </div>
    )
  }

  return (
    <div className="newsletter-subscriptions-list">
      <div className="subscriptions-header">
        <h3>Your Newsletter Subscriptions</h3>
        <span className="subscriptions-count">
          {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="subscriptions-grid">
        {subscriptions.map((subscription: NewsletterSubscription) => (
          <div key={subscription.id} className="subscription-card">
            <div className="subscription-header">
              {subscription.siteIcon && (
                <img
                  src={subscription.siteIcon}
                  alt=""
                  className="subscription-icon"
                />
              )}
              <div className="subscription-info">
                <h4 className="subscription-title">
                  {subscription.title || subscription.senderEmail}
                </h4>
                <p className="subscription-sender">{subscription.senderEmail}</p>
              </div>
            </div>

            {subscription.newsletterEmail && (
              <div className="subscription-email">
                <div className="email-label">Forward newsletters to:</div>
                <div className="email-box">
                  <code className="email-address">{subscription.newsletterEmail}</code>
                  <button
                    className={`email-copy-button ${copiedEmailId === subscription.id ? 'copied' : ''}`}
                    onClick={() => handleCopyEmail(subscription.id, subscription.newsletterEmail!)}
                    title="Copy email address"
                  >
                    {copiedEmailId === subscription.id ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            )}

            <div className="subscription-stats">
              <div className="stat">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{subscription.itemCount}</span>
              </div>
              {subscription.unreadCount !== null &&
                subscription.unreadCount !== undefined && (
                  <div className="stat unread">
                    <span className="stat-label">Unread:</span>
                    <span className="stat-value">{subscription.unreadCount}</span>
                  </div>
                )}
            </div>

            {(subscription.folder || subscription.autoAddLabels) && (
              <div className="subscription-settings">
                {subscription.folder && (
                  <div className="setting-item">
                    <span className="setting-icon">📁</span>
                    <span className="setting-value">{subscription.folder}</span>
                  </div>
                )}
                {subscription.autoAddLabels &&
                  subscription.autoAddLabels.length > 0 && (
                    <div className="setting-item">
                      <span className="setting-icon">🏷️</span>
                      <span className="setting-value">
                        {subscription.autoAddLabels.join(', ')}
                      </span>
                    </div>
                  )}
              </div>
            )}

            <div className="subscription-actions">
              {onEditSettings && (
                <button
                  className="action-button edit"
                  onClick={() => onEditSettings(subscription)}
                  disabled={unsubscribing}
                >
                  ⚙️ Settings
                </button>
              )}
              <button
                className="action-button unsubscribe"
                onClick={() =>
                  handleUnsubscribe(subscription.id, subscription.senderEmail)
                }
                disabled={
                  unsubscribing || unsubscribingId === subscription.id
                }
              >
                {unsubscribingId === subscription.id
                  ? 'Unsubscribing...'
                  : '🗑️ Unsubscribe'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NewsletterSubscriptionsList

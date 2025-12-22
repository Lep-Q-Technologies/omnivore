import React, { useEffect, useState } from 'react'

import { useNewsletterEmail } from '../lib/graphql-client'

const NewsletterEmailDisplay: React.FC = () => {
  const { data, loading, error, fetchNewsletterEmail } = useNewsletterEmail()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchNewsletterEmail()
  }, [fetchNewsletterEmail])

  const handleCopyEmail = async () => {
    if (data?.newsletterEmail) {
      try {
        await navigator.clipboard.writeText(data.newsletterEmail)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy email:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="newsletter-email-display loading">
        <p>Loading newsletter email...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="newsletter-email-display error">
        <p>Error loading newsletter email: {error.message}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="newsletter-email-display">
      <div className="newsletter-email-header">
        <h3>Your Newsletter Email Address</h3>
        <p className="newsletter-email-description">
          Forward newsletters to this email address to save them in your Omnivore library
        </p>
      </div>

      <div className="newsletter-email-content">
        <div className="newsletter-email-box">
          <code className="newsletter-email-address">{data.newsletterEmail}</code>
          <button
            className={`copy-button ${copied ? 'copied' : ''}`}
            onClick={handleCopyEmail}
            title="Copy email address"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="newsletter-email-info">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul>
            <li>Forward newsletters from your email client to this address</li>
            <li>Omnivore will automatically save and organize them</li>
            <li>Manage your newsletter subscriptions below</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default NewsletterEmailDisplay

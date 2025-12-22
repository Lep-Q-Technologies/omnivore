import React, { useState } from 'react'
import { useSubscribeToNewsletter } from '../lib/graphql-client'

interface AddNewsletterFormProps {
  onSuccess?: () => void
}

const AddNewsletterForm: React.FC<AddNewsletterFormProps> = ({ onSuccess }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [senderEmail, setSenderEmail] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { subscribe, loading } = useSubscribeToNewsletter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!senderEmail) {
      setError('Please enter a sender email address')

      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(senderEmail)) {
      setError('Please enter a valid email address')

      return
    }

    try {
      await subscribe(senderEmail, title || undefined)

      // Reset form
      setSenderEmail('')
      setTitle('')
      setIsExpanded(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add newsletter')
    }
  }

  if (!isExpanded) {
    return (
      <div className="add-newsletter-prompt">
        <button
          className="add-newsletter-button"
          onClick={() => setIsExpanded(true)}
        >
          <span className="button-icon">➕</span>
          <span className="button-text">Add Newsletter Subscription</span>
        </button>
        <p className="add-newsletter-hint">
          Manually add a newsletter by entering the sender's email address.
        </p>
      </div>
    )
  }

  return (
    <div className="add-newsletter-form-container">
      <div className="add-newsletter-form-header">
        <h3>Add Newsletter Subscription</h3>
        <button
          className="close-form-button"
          onClick={() => {
            setIsExpanded(false)
            setSenderEmail('')
            setTitle('')
            setError(null)
          }}
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add-newsletter-form">
        <div className="form-group">
          <label htmlFor="sender-email" className="form-label">
            Sender Email Address <span className="required">*</span>
          </label>
          <input
            id="sender-email"
            type="email"
            className="form-input"
            placeholder="newsletter@example.com"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            disabled={loading}
            required
          />
          <p className="form-hint">
            The email address that sends the newsletter
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="newsletter-title" className="form-label">
            Newsletter Title (optional)
          </label>
          <input
            id="newsletter-title"
            type="text"
            className="form-input"
            placeholder="e.g., Morning Brew, The Daily Tech"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
          <p className="form-hint">
            A friendly name for this newsletter (can be changed later)
          </p>
        </div>

        {error && (
          <div className="form-error">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="form-button secondary"
            onClick={() => {
              setIsExpanded(false)
              setSenderEmail('')
              setTitle('')
              setError(null)
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="form-button primary"
            disabled={loading || !senderEmail}
          >
            {loading ? 'Adding...' : 'Add Newsletter'}
          </button>
        </div>
      </form>

      <div className="form-footer-note">
        <p className="note-icon">ℹ️</p>
        <p className="note-text">
          <strong>Note:</strong> In the future, newsletters will be
          automatically added when you forward emails to your Omnivore address.
          For now, you can manually add them using this form.
        </p>
      </div>
    </div>
  )
}

export default AddNewsletterForm

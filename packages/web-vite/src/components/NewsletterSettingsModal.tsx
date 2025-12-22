import React, { useEffect, useState } from 'react'

import type { NewsletterSubscription } from '../types/api'
import { useUpdateNewsletterSettings } from '../lib/graphql-client'

interface NewsletterSettingsModalProps {
  subscription: NewsletterSubscription | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const NewsletterSettingsModal: React.FC<NewsletterSettingsModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('')
  const [folder, setFolder] = useState('')
  const [labelsInput, setLabelsInput] = useState('')
  const { updateSettings, loading, error } = useUpdateNewsletterSettings()

  useEffect(() => {
    if (subscription) {
      setTitle(subscription.title || '')
      setFolder(subscription.folder || '')
      setLabelsInput(subscription.autoAddLabels?.join(', ') || '')
    }
  }, [subscription])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscription) return

    try {
      const autoAddLabels = labelsInput
        .split(',')
        .map((label) => label.trim())
        .filter((label) => label.length > 0)

      await updateSettings(subscription.id, {
        title: title || undefined,
        folder: folder || undefined,
        autoAddLabels: autoAddLabels.length > 0 ? autoAddLabels : undefined,
      })

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      console.error('Failed to update newsletter settings:', err)
    }
  }

  if (!isOpen || !subscription) {
    return null
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Newsletter Settings</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label className="form-label">
              Newsletter Title
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={subscription.senderEmail}
              />
            </label>
            <p className="form-hint">
              Override the newsletter title for display purposes
            </p>
          </div>

          <div className="form-section">
            <label className="form-label">
              Auto-Route to Folder
              <select
                className="form-select"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              >
                <option value="">Default (Inbox)</option>
                <option value="inbox">Inbox</option>
                <option value="archive">Archive</option>
                <option value="following">Following</option>
                <option value="later">Later</option>
              </select>
            </label>
            <p className="form-hint">
              Automatically move newsletters to a specific folder
            </p>
          </div>

          <div className="form-section">
            <label className="form-label">
              Auto-Add Labels
              <input
                type="text"
                className="form-input"
                value={labelsInput}
                onChange={(e) => setLabelsInput(e.target.value)}
                placeholder="newsletter, tech, design"
              />
            </label>
            <p className="form-hint">
              Comma-separated list of labels to automatically add
            </p>
          </div>

          {error && (
            <div className="form-error">
              <p>Failed to update settings: {error.message}</p>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewsletterSettingsModal

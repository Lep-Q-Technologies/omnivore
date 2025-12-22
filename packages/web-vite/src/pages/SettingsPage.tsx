// Settings page component for Omnivore Vite migration

import '../styles/Newsletter.css'

import React, { useState } from 'react'

import NewsletterEmailDisplay from '../components/NewsletterEmailDisplay'
import NewsletterSettingsModal from '../components/NewsletterSettingsModal'
import NewsletterSubscriptionsList from '../components/NewsletterSubscriptionsList'
import type { NewsletterSubscription } from '../types/api'

const SettingsPage: React.FC = () => {
  const [editingSubscription, setEditingSubscription] =
    useState<NewsletterSubscription | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEditSettings = (subscription: NewsletterSubscription) => {
    setEditingSubscription(subscription)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSubscription(null)
  }

  const handleSettingsUpdated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>Settings</h1>

        <section className="settings-section newsletter-section">
          <h2>Newsletter Subscriptions</h2>

          <NewsletterEmailDisplay />

          <div className="newsletter-instructions">
            <p className="instructions-text">
              📬 Newsletters are automatically added when you receive your first email.
              Simply subscribe to newsletters using your Omnivore email address shown above.
            </p>
          </div>

          <NewsletterSubscriptionsList
            key={refreshKey}
            onEditSettings={handleEditSettings}
          />
        </section>

        <NewsletterSettingsModal
          subscription={editingSubscription}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSettingsUpdated}
        />
      </div>
    </div>
  )
}

export default SettingsPage

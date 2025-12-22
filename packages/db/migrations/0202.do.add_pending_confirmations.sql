-- Migration: Add pending_confirmation table for tracking newsletter confirmations
-- This enables better UX by showing users pending confirmations and allowing resends

CREATE TABLE omnivore.pending_confirmation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES omnivore.user(id) ON DELETE CASCADE,

  -- Newsletter information
  newsletter_sender TEXT NOT NULL,
  newsletter_name TEXT NOT NULL,
  newsletter_platform TEXT, -- 'substack', 'beehiiv', 'mailchimp', etc.

  -- Original confirmation email (stored for resending)
  confirmation_email_html TEXT NOT NULL,
  confirmation_email_text TEXT,
  confirmation_url TEXT, -- Extracted confirmation link (if found)

  -- Forwarding tracking
  forwarded_to TEXT NOT NULL, -- User's primary email where we forwarded
  forward_attempts INTEGER DEFAULT 0,
  last_forwarded_at TIMESTAMPTZ NOT NULL,
  forwarded_to_emails TEXT[], -- History of emails we've forwarded to

  -- Status
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  expired BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL, -- Usually 7 days from creation
  user_dismissed BOOLEAN DEFAULT FALSE, -- User clicked "not interested"

  -- Metadata for support and debugging
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_pending_confirmation_user_id
  ON omnivore.pending_confirmation(user_id);

-- Index for pending confirmations (most common query)
CREATE INDEX idx_pending_confirmation_pending
  ON omnivore.pending_confirmation(user_id, confirmed, expired, user_dismissed)
  WHERE confirmed = FALSE AND expired = FALSE AND user_dismissed = FALSE;

-- Index for auto-confirmation matching (when newsletter email arrives)
CREATE INDEX idx_pending_confirmation_newsletter
  ON omnivore.pending_confirmation(user_id, newsletter_sender, confirmed)
  WHERE confirmed = FALSE;

-- Index for expiration cleanup (cron job)
CREATE INDEX idx_pending_confirmation_expires
  ON omnivore.pending_confirmation(expires_at)
  WHERE confirmed = FALSE AND expired = FALSE AND user_dismissed = FALSE;

-- Trigger to update updated_at
CREATE TRIGGER update_pending_confirmation_updated_at
  BEFORE UPDATE ON omnivore.pending_confirmation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE omnivore.pending_confirmation IS
  'Tracks pending newsletter subscription confirmations for better UX and support';

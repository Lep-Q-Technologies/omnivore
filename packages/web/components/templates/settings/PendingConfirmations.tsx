import { useState } from 'react'
import { Box, HStack, SpanBox, VStack } from '../../elements/LayoutPrimitives'
import { StyledText } from '../../elements/StyledText'
import { Button } from '../../elements/Button'
import { theme } from '../../tokens/stitches.config'
import { PendingConfirmation } from '../../../lib/networking/queries/useGetPendingConfirmationsQuery'
import {
  dismissConfirmationMutation,
  resendConfirmationMutation,
} from '../../../lib/networking/mutations/pendingConfirmationMutations'
import { showErrorToast, showSuccessToast } from '../../../lib/toastHelpers'
import {
  CaretDownIcon,
  CaretRightIcon,
  ClockIcon,
  PaperPlaneRightIcon,
  XIcon,
} from '@phosphor-icons/react'

type PendingConfirmationsProps = {
  confirmations: PendingConfirmation[]
  onUpdate: () => void
}

export function PendingConfirmationsSection(props: PendingConfirmationsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const pendingOnly = props.confirmations.filter((c) => c.isPending)

  if (pendingOnly.length === 0) {
    return null
  }

  return (
    <VStack
      css={{
        width: '100%',
        marginTop: '20px',
        marginBottom: '20px',
        borderTop: '1px solid $grayBorder',
        paddingTop: '20px',
      }}
    >
      <HStack
        distribution="start"
        alignment="center"
        css={{
          width: '100%',
          cursor: 'pointer',
          paddingLeft: '20px',
          paddingRight: '20px',
          '&:hover': {
            backgroundColor: '$grayBgHover',
          },
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <CaretDownIcon size={20} color={theme.colors.grayText.toString()} />
        ) : (
          <CaretRightIcon size={20} color={theme.colors.grayText.toString()} />
        )}
        <ClockIcon
          size={20}
          color={theme.colors.omnivoreCtaYellow.toString()}
        />
        <StyledText
          css={{
            fontSize: '16px',
            fontWeight: '500',
            marginLeft: '8px',
            color: '$grayText',
          }}
        >
          Pending Confirmations ({pendingOnly.length})
        </StyledText>
      </HStack>

      {isExpanded && (
        <VStack css={{ width: '100%', marginTop: '10px' }}>
          {pendingOnly.map((confirmation, i) => (
            <PendingConfirmationRow
              key={confirmation.id}
              confirmation={confirmation}
              isLast={i === pendingOnly.length - 1}
              onUpdate={props.onUpdate}
            />
          ))}
        </VStack>
      )}
    </VStack>
  )
}

type PendingConfirmationRowProps = {
  confirmation: PendingConfirmation
  isLast: boolean
  onUpdate: () => void
}

function PendingConfirmationRow(props: PendingConfirmationRowProps) {
  const { confirmation } = props
  const [isResending, setIsResending] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  const handleResend = async () => {
    setIsResending(true)
    const success = await resendConfirmationMutation(confirmation.id)
    setIsResending(false)

    if (success) {
      showSuccessToast('Confirmation email resent', {
        position: 'bottom-right',
      })
      props.onUpdate()
    } else {
      showErrorToast('Failed to resend confirmation', {
        position: 'bottom-right',
      })
    }
  }

  const handleDismiss = async () => {
    setIsDismissing(true)
    const success = await dismissConfirmationMutation(confirmation.id)
    setIsDismissing(false)

    if (success) {
      showSuccessToast('Confirmation dismissed', { position: 'bottom-right' })
      props.onUpdate()
    } else {
      showErrorToast('Failed to dismiss confirmation', {
        position: 'bottom-right',
      })
    }
  }

  const timeLabel = () => {
    const hours = confirmation.durationPendingHours
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  const statusLabel = () => {
    if (confirmation.isExpiringSoon) {
      return '⚠️ Expires soon'
    }
    if (confirmation.shouldSendReminder) {
      return '📬 Awaiting confirmation'
    }
    return '📬 Confirmation sent'
  }

  return (
    <Box
      css={{
        width: '100%',
        padding: '15px 20px',
        borderBottom: props.isLast ? 'none' : '1px solid $grayBorder',
        backgroundColor: '$grayBg',
        '&:hover': {
          backgroundColor: '$grayBgHover',
        },
      }}
    >
      <VStack alignment="start" css={{ width: '100%' }}>
        <HStack
          distribution="between"
          alignment="center"
          css={{ width: '100%' }}
        >
          <VStack alignment="start" css={{ flex: 1 }}>
            <StyledText
              css={{
                fontSize: '14px',
                fontWeight: '500',
                color: '$grayTextContrast',
              }}
            >
              {confirmation.newsletterName}
            </StyledText>
            <StyledText
              css={{
                fontSize: '12px',
                color: '$grayText',
                marginTop: '4px',
              }}
            >
              {confirmation.newsletterSender}
            </StyledText>
          </VStack>

          <HStack css={{ gap: '8px' }}>
            <Button
              style="ghost"
              css={{
                fontSize: '12px',
                padding: '6px 12px',
                height: 'auto',
              }}
              onClick={handleResend}
              disabled={isResending}
            >
              <PaperPlaneRightIcon size={14} />
              <SpanBox css={{ marginLeft: '4px' }}>
                {isResending ? 'Resending...' : 'Resend'}
              </SpanBox>
            </Button>
            <Button
              style="ghost"
              css={{
                fontSize: '12px',
                padding: '6px 12px',
                height: 'auto',
              }}
              onClick={handleDismiss}
              disabled={isDismissing}
            >
              <XIcon size={14} />
              <SpanBox css={{ marginLeft: '4px' }}>
                {isDismissing ? 'Dismissing...' : 'Dismiss'}
              </SpanBox>
            </Button>
          </HStack>
        </HStack>

        <HStack css={{ marginTop: '8px', gap: '12px', flexWrap: 'wrap' }}>
          <StyledText css={{ fontSize: '11px', color: '$grayText' }}>
            {statusLabel()}
          </StyledText>
          <StyledText css={{ fontSize: '11px', color: '$grayText' }}>
            • Sent {timeLabel()}
          </StyledText>
          <StyledText css={{ fontSize: '11px', color: '$grayText' }}>
            • Forwarded to {confirmation.forwardedTo}
          </StyledText>
          {confirmation.forwardAttempts > 1 && (
            <StyledText css={{ fontSize: '11px', color: '$omnivoreCtaYellow' }}>
              • Resent {confirmation.forwardAttempts - 1} time
              {confirmation.forwardAttempts > 2 ? 's' : ''}
            </StyledText>
          )}
        </HStack>

        {confirmation.confirmationUrl && (
          <StyledText
            css={{
              fontSize: '11px',
              color: '$grayText',
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '$grayBgActive',
              borderRadius: '4px',
              wordBreak: 'break-all',
            }}
          >
            💡 Tip: Check your email at {confirmation.forwardedTo} and click the
            confirmation link
          </StyledText>
        )}
      </VStack>
    </Box>
  )
}

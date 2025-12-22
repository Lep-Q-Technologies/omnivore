import { gql } from 'graphql-request'
import useSWR from 'swr'
import { gqlFetcher } from '../networkHelpers'
import { useCallback } from 'react'

export type PendingConfirmation = {
  id: string
  userId: string
  newsletterSender: string
  newsletterName: string
  newsletterPlatform?: string
  confirmationUrl?: string
  forwardedTo: string
  forwardAttempts: number
  lastForwardedAt: string
  confirmed: boolean
  confirmedAt?: string
  expired: boolean
  expiresAt: string
  userDismissed: boolean
  createdAt: string
  updatedAt: string

  // Computed fields
  isPending: boolean
  durationPendingHours: number
  shouldSendReminder: boolean
  isExpiringSoon: boolean
}

type PendingConfirmationsData = {
  pendingConfirmations: PendingConfirmation[]
}

const PENDING_CONFIRMATIONS_QUERY = gql`
  query GetPendingConfirmations($includeCompleted: Boolean = false) {
    pendingConfirmations(includeCompleted: $includeCompleted) {
      id
      userId
      newsletterSender
      newsletterName
      newsletterPlatform
      confirmationUrl
      forwardedTo
      forwardAttempts
      lastForwardedAt
      confirmed
      confirmedAt
      expired
      expiresAt
      userDismissed
      createdAt
      updatedAt
      isPending
      durationPendingHours
      shouldSendReminder
      isExpiringSoon
    }
  }
`

export function useGetPendingConfirmationsQuery(includeCompleted = false) {
  const { data, error, mutate, isValidating } = useSWR<PendingConfirmationsData>(
    [PENDING_CONFIRMATIONS_QUERY, { includeCompleted }],
    gqlFetcher
  )

  const revalidate = useCallback(() => {
    mutate()
  }, [mutate])

  return {
    pendingConfirmations: data?.pendingConfirmations ?? [],
    isLoading: !error && !data,
    isError: error,
    isValidating,
    revalidate,
  }
}

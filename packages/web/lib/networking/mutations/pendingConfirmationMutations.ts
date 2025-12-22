import { gql } from 'graphql-request'
import { gqlFetcher } from '../networkHelpers'

const RESEND_CONFIRMATION_MUTATION = gql`
  mutation ResendConfirmationEmail(
    $confirmationId: String!
    $alternateEmail: String
  ) {
    resendConfirmationEmail(
      confirmationId: $confirmationId
      alternateEmail: $alternateEmail
    ) {
      success
      errors
    }
  }
`

const DISMISS_CONFIRMATION_MUTATION = gql`
  mutation DismissConfirmation($confirmationId: String!) {
    dismissConfirmation(confirmationId: $confirmationId) {
      success
      errors
    }
  }
`

export async function resendConfirmationMutation(
  confirmationId: string,
  alternateEmail?: string
): Promise<boolean> {
  try {
    const data = await gqlFetcher(RESEND_CONFIRMATION_MUTATION, {
      confirmationId,
      alternateEmail,
    })
    return data.resendConfirmationEmail.success
  } catch (error) {
    console.error('Failed to resend confirmation:', error)
    return false
  }
}

export async function dismissConfirmationMutation(
  confirmationId: string
): Promise<boolean> {
  try {
    const data = await gqlFetcher(DISMISS_CONFIRMATION_MUTATION, {
      confirmationId,
    })
    return data.dismissConfirmation.success
  } catch (error) {
    console.error('Failed to dismiss confirmation:', error)
    return false
  }
}

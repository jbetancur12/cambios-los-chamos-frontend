import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { useAuth } from '@/contexts/AuthContext'

export function PostHogIdentifier() {
  const { user } = useAuth()
  const posthog = usePostHog()

  useEffect(() => {
    // Only identify SUPER_ADMIN users in PostHog
    if (posthog && user && user.role === 'SUPER_ADMIN') {
      posthog.identify(user.id, {
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      })
    } else if (posthog && !user) {
      posthog.reset()
    }
  }, [user, posthog])

  return null
}

import { createMiddleware } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }
    return next({ context: { userId } })
  },
)

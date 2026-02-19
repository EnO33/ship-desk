import { createMiddleware } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }
    return next({ context: { userId } })
  },
)

export const userMiddleware = createMiddleware({ type: 'function' })
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, context.userId))
      .limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    return next({ context: { user } })
  })

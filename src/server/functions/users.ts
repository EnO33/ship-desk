import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'

export const getUserByClerkId = createServerFn({ method: 'GET' })
  .validator((clerkId: string) => clerkId)
  .handler(async ({ data: clerkId }): Promise<Result<typeof users.$inferSelect>> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (!user) return err('User not found')
    return ok(user)
  })

export const upsertUser = createServerFn({ method: 'POST' })
  .validator(
    (data: { clerkId: string; email: string; name?: string; avatarUrl?: string }) => data,
  )
  .handler(async ({ data }): Promise<Result<typeof users.$inferSelect>> => {
    const [user] = await db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
        },
      })
      .returning()

    if (!user) return err('Failed to upsert user')
    return ok(user)
  })

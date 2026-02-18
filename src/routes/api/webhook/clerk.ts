import { createAPIFileRoute } from '@tanstack/react-start/api'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

type ClerkWebhookEvent = {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
  }
}

export const APIRoute = createAPIFileRoute('/api/webhook/clerk')({
  POST: async ({ request }) => {
    const body = (await request.json()) as ClerkWebhookEvent

    const { type, data } = body
    const email = data.email_addresses[0]?.email_address ?? ''
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ')

    if (type === 'user.created' || type === 'user.updated') {
      await db
        .insert(users)
        .values({
          clerkId: data.id,
          email,
          name: name || null,
          avatarUrl: data.image_url ?? null,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: { email, name: name || null, avatarUrl: data.image_url ?? null },
        })
    }

    if (type === 'user.deleted') {
      await db.delete(users).where(eq(users.clerkId, data.id))
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  },
})

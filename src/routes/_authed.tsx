import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { auth, currentUser } from '@clerk/tanstack-react-start/server'
import { Header } from '@/components/layout/header'
import { db } from '@/db'
import { users } from '@/db/schema'

const syncAndGetUser = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) return null

  const clerk = await currentUser()
  if (!clerk) return null

  const email = clerk.emailAddresses[0]?.emailAddress ?? ''
  const name = [clerk.firstName, clerk.lastName].filter(Boolean).join(' ')

  await db
    .insert(users)
    .values({
      clerkId: userId,
      email,
      name: name || null,
      avatarUrl: clerk.imageUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email, name: name || null, avatarUrl: clerk.imageUrl ?? null },
    })

  return { userId }
})

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const result = await syncAndGetUser()
    if (!result) {
      throw redirect({ to: '/' })
    }
    return { userId: result.userId }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

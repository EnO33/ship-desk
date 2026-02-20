import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { Header } from '@/components/layout/header'
import { upsertUser } from '@/server/functions/users'

const ensureAuthed = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) return null

  // Upsert a minimal user record so the user row exists
  await upsertUser({ data: { clerkId: userId, email: '' } })

  return { userId }
})

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const result = await ensureAuthed()
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
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}

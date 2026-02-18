import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { Header } from '@/components/layout/header'

const getAuthState = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  return { userId }
})

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const { userId } = await getAuthState()
    if (!userId) {
      throw redirect({ to: '/' })
    }
    return { userId }
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

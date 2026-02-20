import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SignedIn, SignedOut, SignInButton } from '@clerk/tanstack-react-start'
import { FileText, Map, MessageSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getPublicProjectsCount } from '@/server/functions/projects'

export const Route = createFileRoute('/')({
  loader: () => getPublicProjectsCount(),
  component: LandingPage,
})

const features = [
  { key: 'changelog', icon: FileText, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  { key: 'roadmap', icon: Map, color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  { key: 'feedback', icon: MessageSquare, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
] as const

function LandingPage() {
  const result = Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="container relative mx-auto px-4 py-28 text-center md:py-36">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              {t('landing.hero.title')}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" className="gap-2 shadow-md shadow-primary/25 transition-transform hover:scale-105">
                    {t('landing.hero.cta')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard">
                  <Button size="lg" className="gap-2 shadow-md shadow-primary/25 transition-transform hover:scale-105">
                    {t('dashboard.title')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map(({ key, icon: Icon, color }) => (
              <div
                key={key}
                className="group rounded-xl border bg-card p-8 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">
                  {t(`landing.features.${key}.title`)}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {t(`landing.features.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Public Projects CTA */}
        {result.ok && result.data > 0 && (
          <section className="border-t bg-muted/50">
            <div className="container mx-auto px-4 py-20 text-center">
              <p className="text-5xl font-bold text-primary">{result.data}</p>
              <p className="mt-2 text-lg text-muted-foreground">
                {t('explore.publicProjects')}
              </p>
              <Link to="/explore" search={{ page: 1, search: undefined }} className="mt-6 inline-block">
                <Button size="lg" variant="outline" className="gap-2 transition-transform hover:scale-105">
                  {t('explore.viewAll')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

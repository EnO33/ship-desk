import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SignedIn, SignedOut, SignInButton } from '@clerk/tanstack-react-start'
import { FileText, Map, MessageSquare, ArrowRight, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getPublicProjects } from '@/server/functions/projects'

export const Route = createFileRoute('/')({
  loader: () => getPublicProjects({ data: { page: 1, limit: 6 } }),
  component: LandingPage,
})

const featureIcons = {
  changelog: FileText,
  roadmap: Map,
  feedback: MessageSquare,
} as const

function LandingPage() {
  const result = Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="container relative mx-auto px-4 py-24 text-center md:py-32">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              {t('landing.hero.title')}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" className="gap-2">
                    {t('landing.hero.cta')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard">
                  <Button size="lg" className="gap-2">
                    {t('dashboard.title')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {(Object.keys(featureIcons) as Array<keyof typeof featureIcons>).map(
              (key) => {
                const Icon = featureIcons[key]
                return (
                  <div
                    key={key}
                    className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">
                      {t(`landing.features.${key}.title`)}
                    </h3>
                    <p className="text-muted-foreground">
                      {t(`landing.features.${key}.description`)}
                    </p>
                  </div>
                )
              },
            )}
          </div>
        </section>

        {/* Public Projects */}
        {result.ok && result.data.projects.length > 0 && (
          <section className="border-t">
            <div className="container mx-auto px-4 py-20">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold">{t('explore.title')}</h2>
                <p className="mt-2 text-muted-foreground">{t('explore.subtitle')}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {result.data.projects.map((project) => (
                  <Link
                    key={project.id}
                    to="/p/$slug"
                    params={{ slug: project.slug }}
                    search={{ page: 1 }}
                  >
                    <Card className="transition-shadow hover:shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Folder className="h-5 w-5 text-primary" />
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <CardDescription>{project.description}</CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>

              {result.data.total > 6 && (
                <div className="mt-8 text-center">
                  <Link to="/explore" search={{ page: 1, search: undefined }}>
                    <Button variant="outline" className="gap-2">
                      {t('explore.viewAll')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { getPublicRoadmap } from '@/server/functions/roadmap'
import { ROADMAP_STATUSES, type RoadmapStatus, APP_NAME } from '@/lib/constants'

export const Route = createFileRoute('/p/$slug/roadmap')({
  loader: ({ params }) => getPublicRoadmap({ data: params.slug }),
  head: ({ loaderData }) => {
    const name = loaderData?.ok ? loaderData.data.project.name : ''
    const desc = loaderData?.ok
      ? (loaderData.data.project.description ?? `Roadmap for ${name}`)
      : ''
    const title = name ? `${name} — Roadmap` : 'Roadmap'
    return {
      meta: [
        { title },
        { name: 'description', content: desc },
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        { property: 'og:type', content: 'website' },
      ],
    }
  },
  component: PublicRoadmapPage,
})

const statusColors: Record<RoadmapStatus, string> = {
  planned: 'bg-blue-500/10 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-500/10 text-amber-700 border-amber-200',
  done: 'bg-green-500/10 text-green-700 border-green-200',
}

function PublicRoadmapPage() {
  const result = Route.useLoaderData()
  const { slug } = Route.useParams()
  const { t } = useTranslation()

  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{result.error}</p>
      </div>
    )
  }

  const { project, items } = result.data

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/explore"
            search={{ page: 1, search: undefined }}
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>&larr;</span> {t('explore.title')}
          </Link>
          <h1 className="text-xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
          <nav className="mt-4 flex gap-1">
            <Link
              to="/p/$slug"
              params={{ slug }}
              search={{ page: 1 }}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t('project.changelog')}
            </Link>
            <Link
              to="/p/$slug/roadmap"
              params={{ slug }}
              className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              {t('project.roadmap')}
            </Link>
            <Link
              to="/p/$slug/feedback"
              params={{ slug }}
              search={{ page: 1 }}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t('project.feedback')}
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h2 className="mb-8 text-3xl font-bold">{t('roadmap.title')}</h2>

        {items.length === 0 && (
          <p className="text-muted-foreground">{t('roadmap.noItems')}</p>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {ROADMAP_STATUSES.map((status) => {
            const columnItems = items.filter((i) => i.status === status)
            return (
              <div key={status} className="space-y-3">
                <div className={`flex items-center gap-2 rounded-lg p-3 ${statusColors[status]}`}>
                  <span className="font-medium">
                    {t(`roadmap.status.${status}`)}
                  </span>
                  <span className="text-sm opacity-70">
                    {columnItems.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnItems.map((item) => (
                    <Card key={item.id} className="transition-shadow hover:shadow-md">
                      <CardContent className="p-4">
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Powered by <Link to="/" className="font-medium text-foreground hover:text-primary">{APP_NAME}</Link>
      </footer>
    </div>
  )
}

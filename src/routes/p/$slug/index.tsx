import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

import { getPublicChangelogs } from '@/server/functions/changelogs'
import { APP_NAME } from '@/lib/constants'

export const Route = createFileRoute('/p/$slug/')({
  loader: ({ params }) => getPublicChangelogs({ data: params.slug }),
  component: PublicChangelogPage,
})

function PublicChangelogPage() {
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

  const { project, entries } = result.data

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">{project.name}</h1>
          <nav className="flex gap-4 text-sm">
            <Link
              to="/p/$slug"
              params={{ slug }}
              className="font-medium text-primary"
            >
              {t('project.changelog')}
            </Link>
            <Link
              to="/p/$slug/roadmap"
              params={{ slug }}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('project.roadmap')}
            </Link>
            <Link
              to="/p/$slug/feedback"
              params={{ slug }}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('project.feedback')}
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-8 text-3xl font-bold">{t('changelog.title')}</h2>

        {entries.length === 0 && (
          <p className="text-muted-foreground">{t('changelog.noEntries')}</p>
        )}

        <div className="space-y-8">
          {entries.map((entry) => (
            <article key={entry.id}>
              <div className="flex items-center gap-3 mb-2">
                {entry.version && (
                  <Badge variant="outline">v{entry.version}</Badge>
                )}
                <time className="text-sm text-muted-foreground">
                  {entry.publishedAt
                    ? new Date(entry.publishedAt).toLocaleDateString()
                    : ''}
                </time>
              </div>
              <h3 className="text-xl font-semibold">{entry.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {entry.content}
              </p>
              <hr className="mt-8" />
            </article>
          ))}
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Powered by {APP_NAME}
      </footer>
    </div>
  )
}

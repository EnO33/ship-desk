import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/shared/pagination'
import { Header } from '@/components/layout/header'
import { getPublicChangelogs } from '@/server/functions/changelogs'
import { APP_NAME } from '@/lib/constants'

export const Route = createFileRoute('/p/$slug/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ params, deps }) =>
    getPublicChangelogs({ data: { slug: params.slug, page: deps.page, limit: 20 } }),
  head: ({ loaderData }) => {
    const name = loaderData?.ok ? loaderData.data.project.name : ''
    const desc = loaderData?.ok
      ? (loaderData.data.project.description ?? `Changelog for ${name}`)
      : ''
    const title = name ? `${name} — Changelog` : 'Changelog'
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
  component: PublicChangelogPage,
})

function PublicChangelogPage() {
  const result = Route.useLoaderData()
  const { slug } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{result.error}</p>
      </div>
    )
  }

  const { project, entries, total, page, limit } = result.data

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link
              to="/explore"
              search={{ page: 1, search: undefined }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('explore.title')}
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium">{project.name}</span>
          </nav>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
          <nav className="mt-4 flex gap-1">
            <Link
              to="/p/$slug"
              params={{ slug }}
              search={{ page: 1 }}
              className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              {t('project.changelog')}
            </Link>
            <Link
              to="/p/$slug/roadmap"
              params={{ slug }}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-8 text-3xl font-bold">{t('changelog.title')}</h2>

        {entries.length === 0 && (
          <p className="text-muted-foreground">{t('changelog.noEntries')}</p>
        )}

        <div className="space-y-10">
          {entries.map((entry) => (
            <article key={entry.id} className="border-l-2 border-primary/20 pl-6">
              <div className="flex items-center gap-3 mb-2">
                {entry.version && (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">v{entry.version}</Badge>
                )}
                <time className="text-sm font-medium text-muted-foreground">
                  {entry.publishedAt
                    ? new Date(entry.publishedAt).toLocaleDateString()
                    : ''}
                </time>
              </div>
              <h3 className="text-xl font-semibold">{entry.title}</h3>
              <div
                className="prose prose-neutral dark:prose-invert mt-2 max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />
            </article>
          ))}
        </div>

        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={(p) =>
            navigate({ to: '/p/$slug', params: { slug }, search: { page: p } })
          }
        />
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Powered by <Link to="/" className="font-medium text-foreground hover:text-primary">{APP_NAME}</Link>
      </footer>
    </div>
  )
}

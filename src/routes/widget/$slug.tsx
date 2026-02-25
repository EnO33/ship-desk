import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { Rocket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getPublicChangelogs } from '@/server/functions/changelogs'
import { trackPageView } from '@/server/functions/analytics'
import { getVisitorId } from '@/lib/visitor'
import { APP_NAME } from '@/lib/constants'

export const Route = createFileRoute('/widget/$slug')({
  validateSearch: (search: Record<string, unknown>) => ({
    theme: (search.theme as string) || 'system',
  }),
  loader: ({ params }) =>
    getPublicChangelogs({ data: { slug: params.slug, page: 1, limit: 5 } }),
  head: ({ loaderData }) => {
    const name = loaderData?.ok ? loaderData.data.project.name : 'Widget'
    return {
      meta: [
        { title: `${name} — What's New` },
        { name: 'robots', content: 'noindex' },
      ],
    }
  },
  component: WidgetPage,
})

function WidgetPage() {
  const result = Route.useLoaderData()
  const { slug } = Route.useParams()
  const { theme } = Route.useSearch()
  const { t } = useTranslation()
  const { setTheme } = useTheme()

  useEffect(() => {
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      setTheme(theme)
    }
  }, [theme, setTheme])

  useEffect(() => {
    if (!result.ok) return
    trackPageView({ data: { projectSlug: slug, page: 'widget', visitorId: getVisitorId() } })
  }, [])

  if (!result.ok) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{result.error}</p>
      </div>
    )
  }

  const { project, entries } = result.data

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Rocket className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{project.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {t('widget.whatsNew')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {t('widget.noUpdates')}
          </p>
        ) : (
          <div className="space-y-5">
            {entries.map((entry) => (
              <article key={entry.id} className="border-l-2 border-primary/20 pl-4">
                <div className="mb-1 flex items-center gap-2">
                  {entry.version && (
                    <Badge className="bg-primary/10 px-1.5 py-0 text-[11px] text-primary hover:bg-primary/10">
                      v{entry.version}
                    </Badge>
                  )}
                  <time className="text-[11px] text-muted-foreground">
                    {entry.publishedAt
                      ? new Date(entry.publishedAt).toLocaleDateString()
                      : ''}
                  </time>
                </div>
                <h3 className="text-sm font-semibold leading-snug">{entry.title}</h3>
                <div
                  className="prose prose-sm prose-neutral mt-1 max-w-none text-muted-foreground line-clamp-3 dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-4 py-2.5">
        <a
          href={`/p/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('widget.viewAll')} &rarr;
        </a>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {t('widget.poweredBy')}
          <span className="font-semibold">{APP_NAME}</span>
        </a>
      </div>
    </div>
  )
}

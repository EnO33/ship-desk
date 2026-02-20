import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Folder, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Pagination } from '@/components/shared/pagination'
import { RouteLoading } from '@/components/shared/route-loading'
import { RouteError } from '@/components/shared/route-error'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getPublicProjects } from '@/server/functions/projects'

export const Route = createFileRoute('/explore')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({ page: search.page, search: search.search }),
  loader: ({ deps }) =>
    getPublicProjects({ data: { page: deps.page, limit: 12, search: deps.search } }),
  component: ExplorePage,
  pendingComponent: RouteLoading,
  errorComponent: RouteError,
})

function ExplorePage() {
  const result = Route.useLoaderData()
  const { search } = Route.useSearch()
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">{t('explore.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('explore.subtitle')}</p>
          </div>

          <div className="mx-auto mb-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('explore.searchPlaceholder')}
                defaultValue={search ?? ''}
                className="pl-9"
                onChange={(e) => {
                  const value = e.target.value
                  navigate({
                    to: '/explore',
                    search: { page: 1, search: value || undefined },
                    replace: true,
                  })
                }}
              />
            </div>
          </div>

          {!result.ok && (
            <p className="text-center text-destructive">{result.error}</p>
          )}

          {result.ok && result.data.projects.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t('explore.noProjects')}</p>
            </div>
          )}

          {result.ok && result.data.projects.length > 0 && (
            <>
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

              <Pagination
                page={result.data.page}
                total={result.data.total}
                limit={result.data.limit}
                onPageChange={(p) =>
                  navigate({ to: '/explore', search: { page: p, search } })
                }
              />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

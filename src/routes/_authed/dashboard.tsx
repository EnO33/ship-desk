import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RouteLoading } from '@/components/shared/route-loading'
import { RouteError } from '@/components/shared/route-error'
import { getProjects } from '@/server/functions/projects'

export const Route = createFileRoute('/_authed/dashboard')({
  loader: () => getProjects(),
  component: DashboardPage,
  pendingComponent: RouteLoading,
  errorComponent: RouteError,
})

function DashboardPage() {
  const result = Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('dashboard.projects')}</h1>
        <Link to="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('dashboard.newProject')}
          </Button>
        </Link>
      </div>

      {!result.ok && (
        <p className="text-destructive">{result.error}</p>
      )}

      {result.ok && result.data.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t('dashboard.noProjects')}</p>
          <Link to="/projects/new" className="mt-4">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('dashboard.newProject')}
            </Button>
          </Link>
        </div>
      )}

      {result.ok && result.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.data.map((project) => (
            <Link
              key={project.id}
              to="/projects/$projectId/changelog"
              params={{ projectId: String(project.id) }}
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
      )}
    </div>
  )
}

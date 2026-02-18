import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getChangelogs,
  deleteChangelog,
  updateChangelog,
} from '@/server/functions/changelogs'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/changelog/',
)({
  loader: ({ params }) => getChangelogs({ data: Number(params.projectId) }),
  component: ChangelogListPage,
})

function ChangelogListPage() {
  const result = Route.useLoaderData()
  const { projectId } = Route.useParams()
  const { t } = useTranslation()
  const navigate = Route.useNavigate()

  if (!result.ok) {
    return <p className="text-destructive">{result.error}</p>
  }

  const entries = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('changelog.title')}</h2>
        <Link
          to="/projects/$projectId/changelog/new"
          params={{ projectId }}
        >
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('changelog.new')}
          </Button>
        </Link>
      </div>

      {entries.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          {t('changelog.noEntries')}
        </p>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{entry.title}</CardTitle>
                {entry.version && (
                  <Badge variant="outline">v{entry.version}</Badge>
                )}
                <Badge
                  variant={
                    entry.status === 'published' ? 'default' : 'secondary'
                  }
                >
                  {t(`changelog.status.${entry.status}`)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {entry.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const res = await updateChangelog({
                        data: { id: entry.id, status: 'published' },
                      })
                      if (res.ok) {
                        toast.success(t('changelog.status.published'))
                        navigate({ to: '.', reloadDocument: true })
                      }
                    }}
                  >
                    {t('changelog.publish')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const res = await deleteChangelog({ data: entry.id })
                    if (res.ok) {
                      toast.success('Deleted')
                      navigate({ to: '.', reloadDocument: true })
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {entry.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

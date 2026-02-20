import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Pagination } from '@/components/shared/pagination'
import { RouteLoading } from '@/components/shared/route-loading'
import { RouteError } from '@/components/shared/route-error'
import {
  getChangelogs,
  deleteChangelog,
  updateChangelog,
} from '@/server/functions/changelogs'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/changelog/',
)({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ params, deps }) =>
    getChangelogs({ data: { projectId: Number(params.projectId), page: deps.page, limit: 20 } }),
  component: ChangelogListPage,
  pendingComponent: RouteLoading,
  errorComponent: RouteError,
})

function ChangelogListPage() {
  const result = Route.useLoaderData()
  const { projectId } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  if (!result.ok) {
    return <p className="text-destructive">{result.error}</p>
  }

  const { entries, total, page, limit } = result.data

  const handleDelete = async () => {
    if (deleteId === null) return
    const res = await deleteChangelog({ data: deleteId })
    setDeleteId(null)
    if (res.ok) {
      toast.success(t('common.delete'))
      navigate({ to: '.', reloadDocument: true })
    } else {
      toast.error(res.error)
    }
  }

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
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">v{entry.version}</Badge>
                )}
                <Badge
                  className={
                    entry.status === 'published'
                      ? 'bg-green-500/10 text-green-700 hover:bg-green-500/10 dark:text-green-400'
                      : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400'
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
                <Link
                  to="/projects/$projectId/changelog/$changelogId/edit"
                  params={{ projectId, changelogId: String(entry.id) }}
                >
                  <Button size="sm" variant="ghost">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteId(entry.id)}
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

      <Pagination
        page={page}
        total={total}
        limit={limit}
        onPageChange={(p) =>
          navigate({
            to: '/projects/$projectId/changelog',
            params: { projectId },
            search: { page: p },
          })
        }
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description={t('changelog.deleteConfirm')}
        onConfirm={handleDelete}
      />
    </div>
  )
}

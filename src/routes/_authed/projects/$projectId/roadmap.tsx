import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { RouteLoading } from '@/components/shared/route-loading'
import { RouteError } from '@/components/shared/route-error'
import {
  getRoadmapItems,
  createRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
} from '@/server/functions/roadmap'
import { ROADMAP_STATUSES, type RoadmapStatus } from '@/lib/constants'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/roadmap',
)({
  loader: ({ params }) =>
    getRoadmapItems({ data: Number(params.projectId) }),
  component: RoadmapPage,
  pendingComponent: RouteLoading,
  errorComponent: RouteError,
})

const statusColors: Record<RoadmapStatus, string> = {
  planned: 'bg-blue-500/10 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-500/10 text-amber-700 border-amber-200',
  done: 'bg-green-500/10 text-green-700 border-green-200',
}

function RoadmapPage() {
  const result = Route.useLoaderData()
  const { projectId } = Route.useParams()
  const { t } = useTranslation()
  const navigate = Route.useNavigate()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  if (!result.ok) {
    return <p className="text-destructive">{result.error}</p>
  }

  const items = result.data

  const handleCreate = async () => {
    const res = await createRoadmapItem({
      data: {
        projectId: Number(projectId),
        title,
        description: description || undefined,
      },
    })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    setOpen(false)
    setTitle('')
    setDescription('')
    navigate({ to: '.', reloadDocument: true })
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    const res = await deleteRoadmapItem({ data: deleteId })
    setDeleteId(null)
    if (res.ok) {
      navigate({ to: '.', reloadDocument: true })
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('roadmap.title')}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('roadmap.newItem')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('roadmap.newItem')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder={t('roadmap.title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder={t('project.description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <Button onClick={handleCreate} disabled={!title}>
                {t('common.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          {t('roadmap.noItems')}
        </p>
      )}

      {/* Kanban columns */}
      <div className="grid gap-6 md:grid-cols-3">
        {ROADMAP_STATUSES.map((status) => {
          const columnItems = items.filter((item) => item.status === status)
          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[status]}>
                  {t(`roadmap.status.${status}`)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {columnItems.length}
                </span>
              </div>
              <div className="space-y-2">
                {columnItems.map((item) => (
                  <Card key={item.id} className="group">
                    <CardContent className="flex items-start justify-between p-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Select
                          value={item.status}
                          onValueChange={async (value) => {
                            await updateRoadmapItem({
                              data: {
                                id: item.id,
                                status: value as RoadmapStatus,
                              },
                            })
                            navigate({ to: '.', reloadDocument: true })
                          }}
                        >
                          <SelectTrigger className="h-7 w-auto text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROADMAP_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {t(`roadmap.status.${s}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description={t('roadmap.deleteConfirm')}
        onConfirm={handleDelete}
      />
    </div>
  )
}

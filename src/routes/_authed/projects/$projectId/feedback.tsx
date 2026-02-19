import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Trash2, ArrowUpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  getFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
} from '@/server/functions/feedbacks'
import { FEEDBACK_STATUSES } from '@/lib/constants'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/feedback',
)({
  loader: ({ params }) =>
    getFeedbacks({ data: Number(params.projectId) }),
  component: FeedbackPage,
  pendingComponent: RouteLoading,
  errorComponent: RouteError,
})

const categoryColors: Record<string, string> = {
  feature: 'bg-purple-500/10 text-purple-700',
  bug: 'bg-red-500/10 text-red-700',
  improvement: 'bg-blue-500/10 text-blue-700',
}

function FeedbackPage() {
  const result = Route.useLoaderData()
  const { t } = useTranslation()
  const navigate = Route.useNavigate()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  if (!result.ok) {
    return <p className="text-destructive">{result.error}</p>
  }

  const items = result.data

  const handleDelete = async () => {
    if (deleteId === null) return
    const res = await deleteFeedback({ data: deleteId })
    setDeleteId(null)
    if (res.ok) {
      navigate({ to: '.', reloadDocument: true })
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('feedback.title')}</h2>

      {items.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          {t('feedback.noFeedback')}
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="group">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex flex-col items-center gap-1 pt-1">
                <ArrowUpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {item.votesCount}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{item.title}</h3>
                  <Badge className={categoryColors[item.category]}>
                    {t(`feedback.category.${item.category}`)}
                  </Badge>
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.authorName}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Select
                  value={item.status}
                  onValueChange={async (value) => {
                    await updateFeedbackStatus({
                      data: { id: item.id, status: value },
                    })
                    navigate({ to: '.', reloadDocument: true })
                  }}
                >
                  <SelectTrigger className="h-7 w-auto text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`feedback.status.${s}`)}
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

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description={t('feedback.deleteConfirm')}
        onConfirm={handleDelete}
      />
    </div>
  )
}

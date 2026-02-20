import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Trash2, ArrowUpCircle, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Pagination } from '@/components/shared/pagination'
import { RouteLoading } from '@/components/shared/route-loading'
import { RouteError } from '@/components/shared/route-error'
import {
  getFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
} from '@/server/functions/feedbacks'
import { FEEDBACK_STATUSES, FEEDBACK_CATEGORIES } from '@/lib/constants'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/feedback',
)({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ params, deps }) =>
    getFeedbacks({ data: { projectId: Number(params.projectId), page: deps.page, limit: 20 } }),
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
  const { projectId } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())

  if (!result.ok) {
    return <p className="text-destructive">{result.error}</p>
  }

  const { feedbacks, total, page, limit } = result.data

  const toggleFilter = (set: Set<string>, value: string): Set<string> => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const filtered = feedbacks.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter.size > 0 && !categoryFilter.has(item.category)) return false
    if (statusFilter.size > 0 && !statusFilter.has(item.status)) return false
    return true
  })

  const hasFilters = search || categoryFilter.size > 0 || statusFilter.size > 0

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

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('feedback.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('common.filterBy')}:</span>
          {FEEDBACK_CATEGORIES.map((c) => (
            <Badge
              key={c}
              className={`cursor-pointer ${categoryFilter.has(c) ? categoryColors[c] : 'bg-muted text-muted-foreground'}`}
              onClick={() => setCategoryFilter((prev) => toggleFilter(prev, c))}
            >
              {t(`feedback.category.${c}`)}
            </Badge>
          ))}
          <span className="mx-1 text-muted-foreground">|</span>
          {FEEDBACK_STATUSES.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className={`cursor-pointer ${statusFilter.has(s) ? 'border-primary text-primary ring-2 ring-primary/20' : ''}`}
              onClick={() => setStatusFilter((prev) => toggleFilter(prev, s))}
            >
              {t(`feedback.status.${s}`)}
            </Badge>
          ))}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => {
                setSearch('')
                setCategoryFilter(new Set())
                setStatusFilter(new Set())
              }}
            >
              <X className="h-3 w-3" />
              {t('common.clearFilters')}
            </Button>
          )}
        </div>

        {hasFilters && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} {t('common.results')}
          </p>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          {hasFilters ? t('common.noResults') : t('feedback.noFeedback')}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
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

      <Pagination
        page={page}
        total={total}
        limit={limit}
        onPageChange={(p) =>
          navigate({
            to: '/projects/$projectId/feedback',
            params: { projectId },
            search: { page: p },
          })
        }
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description={t('feedback.deleteConfirm')}
        onConfirm={handleDelete}
      />
    </div>
  )
}

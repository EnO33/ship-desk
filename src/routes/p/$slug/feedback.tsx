import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowUpCircle } from 'lucide-react'
import { nanoid } from 'nanoid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pagination } from '@/components/shared/pagination'
import { Header } from '@/components/layout/header'
import {
  getPublicFeedbacks,
  submitFeedback,
  voteFeedback,
} from '@/server/functions/feedbacks'
import { FEEDBACK_CATEGORIES, APP_NAME } from '@/lib/constants'

export const Route = createFileRoute('/p/$slug/feedback')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ params, deps }) =>
    getPublicFeedbacks({ data: { slug: params.slug, page: deps.page, limit: 20 } }),
  head: ({ loaderData }) => {
    const name = loaderData?.ok ? loaderData.data.project.name : ''
    const desc = loaderData?.ok
      ? (loaderData.data.project.description ?? `Feedback for ${name}`)
      : ''
    const title = name ? `${name} — Feedback` : 'Feedback'
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
  component: PublicFeedbackPage,
})

const categoryColors: Record<string, string> = {
  feature: 'bg-purple-500/10 text-purple-700',
  bug: 'bg-red-500/10 text-red-700',
  improvement: 'bg-blue-500/10 text-blue-700',
}

function getVisitorId(): string {
  const key = 'shipdesk_visitor_id'
  const stored = globalThis.document?.cookie
    ?.split('; ')
    .find((c) => c.startsWith(`${key}=`))
    ?.split('=')[1]

  if (stored) return stored

  const id = nanoid()
  if (globalThis.document) {
    document.cookie = `${key}=${id}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`
  }
  return id
}

function PublicFeedbackPage() {
  const result = Route.useLoaderData()
  const { slug } = Route.useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'feature' | 'bug' | 'improvement'>(
    'feature',
  )
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set())

  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{result.error}</p>
      </div>
    )
  }

  const { project, feedbacks, total, page, limit } = result.data

  const handleSubmit = async () => {
    const res = await submitFeedback({
      data: {
        projectId: project.id,
        authorName,
        authorEmail: authorEmail || undefined,
        title,
        description: description || undefined,
        category,
      },
    })

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    setOpen(false)
    setAuthorName('')
    setAuthorEmail('')
    setTitle('')
    setDescription('')
    toast.success(t('feedback.submit'))
    navigate({ to: '.', reloadDocument: true })
  }

  const handleVote = async (feedbackId: number) => {
    if (votedIds.has(feedbackId)) return

    const visitorId = getVisitorId()
    const res = await voteFeedback({ data: { feedbackId, visitorId } })

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    setVotedIds((prev) => new Set(prev).add(feedbackId))
    navigate({ to: '.', reloadDocument: true })
  }

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
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            >
              {t('project.feedback')}
            </Link>
          </nav>
        </div>
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">{t('feedback.title')}</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>{t('feedback.submit')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('feedback.submit')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t('feedback.yourName')}</Label>
                  <Input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('feedback.yourEmail')}</Label>
                  <Input
                    type="email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('feedback.feedbackTitle')}</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('feedback.feedbackDescription')}</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(v) =>
                      setCategory(v as typeof category)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {t(`feedback.category.${c}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!authorName || !title}
                >
                  {t('feedback.submit')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {feedbacks.length === 0 && (
          <p className="text-muted-foreground">{t('feedback.noFeedback')}</p>
        )}

        <div className="space-y-3">
          {feedbacks.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-4 p-4">
                <button
                  onClick={() => handleVote(item.id)}
                  className="flex flex-col items-center gap-1 pt-1 transition-colors hover:text-primary"
                  disabled={votedIds.has(item.id)}
                >
                  <ArrowUpCircle
                    className={`h-5 w-5 ${
                      votedIds.has(item.id)
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <span className="text-sm font-semibold">
                    {item.votesCount}
                  </span>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <Badge className={categoryColors[item.category]}>
                      {t(`feedback.category.${item.category}`)}
                    </Badge>
                    <Badge variant="outline">
                      {t(`feedback.status.${item.status}`)}
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
              </CardContent>
            </Card>
          ))}
        </div>

        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={(p) =>
            navigate({ to: '/p/$slug/feedback', params: { slug }, search: { page: p } })
          }
        />
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Powered by <Link to="/" className="font-medium text-foreground hover:text-primary">{APP_NAME}</Link>
      </footer>
    </div>
  )
}

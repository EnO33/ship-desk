import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getChangelog, updateChangelog } from '@/server/functions/changelogs'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/changelog/$changelogId/edit',
)({
  loader: ({ params }) => getChangelog({ data: Number(params.changelogId) }),
  component: EditChangelogPage,
})

function EditChangelogPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projectId } = Route.useParams()
  const result = Route.useLoaderData()

  const entry = result.ok ? result.data : null

  const [title, setTitle] = useState(entry?.title ?? '')
  const [content, setContent] = useState(entry?.content ?? '')
  const [version, setVersion] = useState(entry?.version ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(
    (entry?.status as 'draft' | 'published') ?? 'draft',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!result.ok) {
    return <p className="text-destructive">{result.error}</p>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await updateChangelog({
      data: {
        id: result.data.id,
        projectId: Number(projectId),
        title,
        content,
        version: version || undefined,
        status,
      },
    })

    setIsSubmitting(false)

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    toast.success(t('changelog.updated'))
    navigate({
      to: '/projects/$projectId/changelog',
      params: { projectId },
    })
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('changelog.edit')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('changelog.title')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">{t('changelog.version')}</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{t('changelog.content')}</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as 'draft' | 'published')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    {t('changelog.status.draft')}
                  </SelectItem>
                  <SelectItem value="published">
                    {t('changelog.status.published')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('common.save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate({
                    to: '/projects/$projectId/changelog',
                    params: { projectId },
                  })
                }
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

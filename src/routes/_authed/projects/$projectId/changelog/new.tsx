import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TiptapEditor } from '@/components/shared/tiptap-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createChangelog } from '@/server/functions/changelogs'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/changelog/new',
)({
  component: NewChangelogPage,
})

function NewChangelogPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projectId } = Route.useParams()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [version, setVersion] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await createChangelog({
      data: {
        projectId: Number(projectId),
        title,
        content,
        version: version || undefined,
        status,
      },
    })

    setIsSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success(t('changelog.new'))
    navigate({
      to: '/projects/$projectId/changelog',
      params: { projectId },
      search: { page: 1 },
    })
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('changelog.new')}</CardTitle>
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
              <Label>{t('changelog.content')}</Label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder={t('changelog.content')}
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
                {t('common.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate({
                    to: '/projects/$projectId/changelog',
                    params: { projectId },
                    search: { page: 1 },
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

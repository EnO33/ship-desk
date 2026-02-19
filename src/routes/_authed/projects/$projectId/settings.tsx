import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { getProject, updateProject, deleteProject } from '@/server/functions/projects'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/settings',
)({
  loader: ({ params }) => getProject({ data: params.projectId }),
  component: SettingsPage,
  pendingComponent: RouteLoading,
  errorComponent: RouteError,
})

function SettingsPage() {
  const { t } = useTranslation()
  const navigate = Route.useNavigate()
  const result = Route.useLoaderData()
  const { projectId } = Route.useParams()

  const project = result.ok ? result.data : null

  const [name, setName] = useState(project?.name ?? '')
  const [slug, setSlug] = useState(project?.slug ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [isPublic, setIsPublic] = useState(project?.isPublic ?? true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!result.ok) {
    return <p className="text-destructive">{result.error}</p>
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const res = await updateProject({
      data: {
        id: Number(projectId),
        name,
        slug,
        description: description || undefined,
      },
    })

    setIsSaving(false)

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    toast.success(t('project.updated'))
    navigate({ to: '.', reloadDocument: true })
  }

  const handleDelete = async () => {
    const res = await deleteProject({ data: Number(projectId) })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success(t('common.delete'))
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-2xl font-bold">{t('project.settings')}</h2>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t('project.update')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('project.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{t('project.slug')}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('project.description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('project.visibility')}</Label>
              <Select
                value={isPublic ? 'public' : 'private'}
                onValueChange={(v) => setIsPublic(v === 'public')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t('project.public')}</SelectItem>
                  <SelectItem value="private">{t('project.private')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">
            {t('common.dangerZone')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('project.deleteConfirm')}
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('common.delete')}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        description={t('project.deleteConfirm')}
        onConfirm={handleDelete}
      />
    </div>
  )
}

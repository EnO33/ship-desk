import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { deleteProject } from '@/server/functions/projects'

export const Route = createFileRoute(
  '/_authed/projects/$projectId/settings',
)({
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useTranslation()
  const navigate = Route.useNavigate()
  const { projectId } = Route.useParams()
  const parentData = Route.useRouteContext()

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-2xl font-bold">{t('project.settings')}</h2>

      <Separator />

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t('common.delete')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={async () => {
              const result = await deleteProject({ data: Number(projectId) })
              if (!result.ok) {
                toast.error(result.error)
                return
              }
              toast.success('Project deleted')
              navigate({ to: '/dashboard' })
            }}
          >
            {t('common.delete')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

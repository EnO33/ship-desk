import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function RouteError({ error }: { error: Error }) {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium">{t('common.error')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.invalidate()}
          >
            {t('common.retry')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

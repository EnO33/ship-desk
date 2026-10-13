import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function RouteError({ error }: ErrorComponentProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const message = error instanceof Error ? error.message : String(error)

  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <Card className="max-w-md border-destructive/30">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium">{t('common.error')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {message}
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

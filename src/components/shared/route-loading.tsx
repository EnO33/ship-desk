import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function RouteLoading() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>{t('common.loading')}</span>
      </div>
    </div>
  )
}

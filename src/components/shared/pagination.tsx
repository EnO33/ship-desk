import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 pt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('common.previous')}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t('common.page')} {page} {t('common.of')} {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="gap-1"
      >
        {t('common.next')}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

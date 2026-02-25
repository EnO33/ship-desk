import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Eye, FileText, MessageSquare, ThumbsUp } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { RouteLoading } from '@/components/shared/route-loading'
import { RouteError } from '@/components/shared/route-error'
import { getAnalyticsOverview, type AnalyticsOverview } from '@/server/functions/analytics'
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from '@/lib/constants'

export const Route = createFileRoute('/_authed/projects/$projectId/analytics')({
  validateSearch: (search: Record<string, unknown>) => ({
    days: ([7, 30, 90].includes(Number(search.days)) ? Number(search.days) : 30) as AnalyticsPeriod,
  }),
  loaderDeps: ({ search }) => ({ days: search.days }),
  loader: ({ params, deps }) =>
    getAnalyticsOverview({ data: { projectId: Number(params.projectId), days: deps.days } }),
  component: AnalyticsPage,
  pendingComponent: RouteLoading,
  errorComponent: RouteError,
})

function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

function KpiCard({
  title,
  value,
  previous,
  icon: Icon,
}: {
  title: string
  value: number
  previous: number
  icon: React.ElementType
}) {
  const { t } = useTranslation()
  const delta = deltaPercent(value, previous)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
        {delta !== null && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {delta >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={delta >= 0 ? 'text-green-600' : 'text-red-600'}>
              {delta > 0 ? '+' : ''}{delta}%
            </span>
            <span className="text-muted-foreground">{t('analytics.vsLastPeriod')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AnalyticsPage() {
  const result = Route.useLoaderData()
  const { projectId } = Route.useParams()
  const { days } = Route.useSearch()
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!result.ok) {
    return <p className="text-destructive">{result.error}</p>
  }

  const { kpis, dailyViews, topChangelogs, feedbackBreakdown } = result.data

  const handlePeriodChange = (value: string) => {
    navigate({
      to: '/projects/$projectId/analytics',
      params: { projectId },
      search: { days: Number(value) as AnalyticsPeriod },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('analytics.title')}</h2>
        <Tabs value={String(days)} onValueChange={handlePeriodChange}>
          <TabsList>
            {ANALYTICS_PERIODS.map((p) => (
              <TabsTrigger key={p} value={String(p)}>
                {t(`analytics.period.${p}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('analytics.totalViews')}
          value={kpis.totalViews}
          previous={kpis.prevTotalViews}
          icon={Eye}
        />
        <KpiCard
          title={t('analytics.changelogViews')}
          value={kpis.changelogViews}
          previous={kpis.prevChangelogViews}
          icon={FileText}
        />
        <KpiCard
          title={t('analytics.feedbacksReceived')}
          value={kpis.feedbacksReceived}
          previous={kpis.prevFeedbacksReceived}
          icon={MessageSquare}
        />
        <KpiCard
          title={t('analytics.votesReceived')}
          value={kpis.votesReceived}
          previous={kpis.prevVotesReceived}
          icon={ThumbsUp}
        />
      </div>

      {/* Daily Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.dailyViews')}</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyViews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('analytics.noData')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dailyViews}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: string) => v.slice(5)}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} className="text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="changelog" stroke="hsl(var(--chart-1, 220 70% 50%))" strokeWidth={2} dot={false} name={t('project.changelog')} />
                <Line type="monotone" dataKey="roadmap" stroke="hsl(var(--chart-2, 160 60% 45%))" strokeWidth={2} dot={false} name={t('project.roadmap')} />
                <Line type="monotone" dataKey="feedback" stroke="hsl(var(--chart-3, 30 80% 55%))" strokeWidth={2} dot={false} name={t('project.feedback')} />
                <Line type="monotone" dataKey="widget" stroke="hsl(var(--chart-4, 280 65% 60%))" strokeWidth={2} dot={false} name="Widget" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Changelogs */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.topChangelogs')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topChangelogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('analytics.noData')}</p>
            ) : (
              <ol className="space-y-3">
                {topChangelogs.map((entry, i) => (
                  <li key={entry.id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">{entry.title}</span>
                    <Badge variant="secondary">{entry.views} {t('analytics.views')}</Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Feedback Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.feedbackByCategory')}</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackBreakdown.byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('analytics.noData')}</p>
              ) : (
                <div className="space-y-2">
                  {feedbackBreakdown.byCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <span className="text-sm">{t(`feedback.category.${item.category}`)}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.feedbackByStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackBreakdown.byStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('analytics.noData')}</p>
              ) : (
                <div className="space-y-2">
                  {feedbackBreakdown.byStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm">{t(`feedback.status.${item.status}`)}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { pageViews, projects, changelogs, feedbacks, feedbackVotes } from '@/db/schema'
import { eq, and, sql, gte, desc } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import { trackPageViewSchema, analyticsOverviewSchema } from '@/lib/validators'
import { userMiddleware } from '@/server/middleware/auth'
import { assertProjectOwner } from '@/server/lib/assert-project-owner'

interface KpiData {
  totalViews: number
  prevTotalViews: number
  changelogViews: number
  prevChangelogViews: number
  feedbacksReceived: number
  prevFeedbacksReceived: number
  votesReceived: number
  prevVotesReceived: number
}

interface DailyView {
  date: string
  changelog: number
  roadmap: number
  feedback: number
  widget: number
}

interface TopChangelog {
  id: number
  title: string
  views: number
}

interface FeedbackBreakdown {
  byCategory: { category: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

export interface AnalyticsOverview {
  kpis: KpiData
  dailyViews: DailyView[]
  topChangelogs: TopChangelog[]
  feedbackBreakdown: FeedbackBreakdown
}

export const trackPageView = createServerFn({ method: 'POST' })
  .inputValidator(trackPageViewSchema)
  .handler(async ({ data }): Promise<Result<boolean>> => {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, data.projectSlug), eq(projects.isPublic, true)))
      .limit(1)

    if (!project) return err('Project not found')

    await db.insert(pageViews).values({
      projectId: project.id,
      page: data.page,
      changelogId: data.changelogId ?? null,
      visitorId: data.visitorId,
    })

    return ok(true)
  })

export const getAnalyticsOverview = createServerFn({ method: 'GET' })
  .inputValidator(analyticsOverviewSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<AnalyticsOverview>> => {
    const ownership = await assertProjectOwner(context.user.id, data.projectId)
    if (!ownership.ok) return ownership

    const days = data.days ?? 30
    const now = new Date()
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const prevPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000)

    // KPI counts: current + previous period in parallel
    const [
      [totalViewsCurrent],
      [totalViewsPrev],
      [changelogViewsCurrent],
      [changelogViewsPrev],
      [feedbacksCurrent],
      [feedbacksPrev],
      [votesCurrent],
      [votesPrev],
    ] = await Promise.all([
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(pageViews)
        .where(and(eq(pageViews.projectId, data.projectId), gte(pageViews.createdAt, periodStart))),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(pageViews)
        .where(
          and(
            eq(pageViews.projectId, data.projectId),
            gte(pageViews.createdAt, prevPeriodStart),
            sql`${pageViews.createdAt} < ${periodStart}`,
          ),
        ),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(pageViews)
        .where(
          and(
            eq(pageViews.projectId, data.projectId),
            eq(pageViews.page, 'changelog'),
            gte(pageViews.createdAt, periodStart),
          ),
        ),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(pageViews)
        .where(
          and(
            eq(pageViews.projectId, data.projectId),
            eq(pageViews.page, 'changelog'),
            gte(pageViews.createdAt, prevPeriodStart),
            sql`${pageViews.createdAt} < ${periodStart}`,
          ),
        ),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(feedbacks)
        .where(and(eq(feedbacks.projectId, data.projectId), gte(feedbacks.createdAt, periodStart))),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(feedbacks)
        .where(
          and(
            eq(feedbacks.projectId, data.projectId),
            gte(feedbacks.createdAt, prevPeriodStart),
            sql`${feedbacks.createdAt} < ${periodStart}`,
          ),
        ),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(feedbackVotes)
        .innerJoin(feedbacks, eq(feedbackVotes.feedbackId, feedbacks.id))
        .where(and(eq(feedbacks.projectId, data.projectId), gte(feedbackVotes.createdAt, periodStart))),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(feedbackVotes)
        .innerJoin(feedbacks, eq(feedbackVotes.feedbackId, feedbacks.id))
        .where(
          and(
            eq(feedbacks.projectId, data.projectId),
            gte(feedbackVotes.createdAt, prevPeriodStart),
            sql`${feedbackVotes.createdAt} < ${periodStart}`,
          ),
        ),
    ])

    const kpis: KpiData = {
      totalViews: totalViewsCurrent.count,
      prevTotalViews: totalViewsPrev.count,
      changelogViews: changelogViewsCurrent.count,
      prevChangelogViews: changelogViewsPrev.count,
      feedbacksReceived: feedbacksCurrent.count,
      prevFeedbacksReceived: feedbacksPrev.count,
      votesReceived: votesCurrent.count,
      prevVotesReceived: votesPrev.count,
    }

    // Daily views grouped by date and page type
    const dailyRaw = await db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${pageViews.createdAt}), 'YYYY-MM-DD')`,
        page: pageViews.page,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(pageViews)
      .where(and(eq(pageViews.projectId, data.projectId), gte(pageViews.createdAt, periodStart)))
      .groupBy(sql`date_trunc('day', ${pageViews.createdAt})`, pageViews.page)
      .orderBy(sql`date_trunc('day', ${pageViews.createdAt})`)

    // Pivot daily data
    const dailyMap = new Map<string, DailyView>()
    for (let d = new Date(periodStart); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      dailyMap.set(key, { date: key, changelog: 0, roadmap: 0, feedback: 0, widget: 0 })
    }
    for (const row of dailyRaw) {
      const entry = dailyMap.get(row.date)
      if (entry && (row.page === 'changelog' || row.page === 'roadmap' || row.page === 'feedback' || row.page === 'widget')) {
        entry[row.page] = row.count
      }
    }
    const dailyViews = Array.from(dailyMap.values())

    // Top 5 changelogs by views
    const topChangelogs = await db
      .select({
        id: changelogs.id,
        title: changelogs.title,
        views: sql<number>`cast(count(${pageViews.id}) as integer)`,
      })
      .from(changelogs)
      .leftJoin(pageViews, eq(pageViews.changelogId, changelogs.id))
      .where(eq(changelogs.projectId, data.projectId))
      .groupBy(changelogs.id, changelogs.title)
      .orderBy(desc(sql`count(${pageViews.id})`))
      .limit(5)

    // Feedback breakdown by category and status
    const [byCategory, byStatus] = await Promise.all([
      db
        .select({
          category: feedbacks.category,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(feedbacks)
        .where(eq(feedbacks.projectId, data.projectId))
        .groupBy(feedbacks.category),
      db
        .select({
          status: feedbacks.status,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(feedbacks)
        .where(eq(feedbacks.projectId, data.projectId))
        .groupBy(feedbacks.status),
    ])

    return ok({
      kpis,
      dailyViews,
      topChangelogs,
      feedbackBreakdown: { byCategory, byStatus },
    })
  })

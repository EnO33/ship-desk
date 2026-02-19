import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { feedbacks, feedbackVotes, projects } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import { createFeedbackSchema, voteFeedbackSchema, paginatedSlugSchema, paginatedProjectSchema } from '@/lib/validators'
import { userMiddleware } from '@/server/middleware/auth'
import { assertProjectOwner } from '@/server/lib/assert-project-owner'

type Feedback = typeof feedbacks.$inferSelect

export const getFeedbacks = createServerFn({ method: 'GET' })
  .inputValidator(paginatedProjectSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<{ feedbacks: Feedback[]; total: number; page: number; limit: number }>> => {
    const ownership = await assertProjectOwner(context.user.id, data.projectId)
    if (!ownership.ok) return ownership

    const page = data.page ?? 1
    const limit = data.limit ?? 50
    const offset = (page - 1) * limit

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(feedbacks)
      .where(eq(feedbacks.projectId, data.projectId))

    const result = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.projectId, data.projectId))
      .orderBy(desc(feedbacks.votesCount))
      .limit(limit)
      .offset(offset)

    return ok({ feedbacks: result, total: countResult.count, page, limit })
  })

export const updateFeedbackStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number; status: string }) => data)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<Feedback>> => {
    const [existing] = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.id, data.id))
      .limit(1)

    if (!existing) return err('Feedback not found')

    const ownership = await assertProjectOwner(context.user.id, existing.projectId)
    if (!ownership.ok) return ownership

    const [updated] = await db
      .update(feedbacks)
      .set({ status: data.status as Feedback['status'] })
      .where(eq(feedbacks.id, data.id))
      .returning()

    if (!updated) return err('Feedback not found')
    return ok(updated)
  })

export const deleteFeedback = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .middleware([userMiddleware])
  .handler(async ({ data: id, context }): Promise<Result<boolean>> => {
    const [existing] = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.id, id))
      .limit(1)

    if (!existing) return err('Feedback not found')

    const ownership = await assertProjectOwner(context.user.id, existing.projectId)
    if (!ownership.ok) return ownership

    await db.delete(feedbacks).where(eq(feedbacks.id, id))
    return ok(true)
  })

// Public endpoints (no auth required)

export const getPublicFeedbacks = createServerFn({ method: 'GET' })
  .inputValidator(paginatedSlugSchema)
  .handler(async ({ data }): Promise<Result<{ project: typeof projects.$inferSelect; feedbacks: Feedback[]; total: number; page: number; limit: number }>> => {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, data.slug), eq(projects.isPublic, true)))
      .limit(1)

    if (!project) return err('Project not found')

    const page = data.page ?? 1
    const limit = data.limit ?? 20
    const offset = (page - 1) * limit

    const whereClause = eq(feedbacks.projectId, project.id)

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(feedbacks)
      .where(whereClause)

    const items = await db
      .select()
      .from(feedbacks)
      .where(whereClause)
      .orderBy(desc(feedbacks.votesCount))
      .limit(limit)
      .offset(offset)

    return ok({ project, feedbacks: items, total: countResult.count, page, limit })
  })

export const submitFeedback = createServerFn({ method: 'POST' })
  .inputValidator(createFeedbackSchema)
  .handler(async ({ data }): Promise<Result<Feedback>> => {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, data.projectId), eq(projects.isPublic, true)),
      )
      .limit(1)

    if (!project) return err('Project not found')

    const [item] = await db
      .insert(feedbacks)
      .values({
        ...data,
        authorEmail: data.authorEmail || null,
      })
      .returning()

    if (!item) return err('Failed to submit feedback')
    return ok(item)
  })

export const voteFeedback = createServerFn({ method: 'POST' })
  .inputValidator(voteFeedbackSchema)
  .handler(async ({ data }): Promise<Result<boolean>> => {
    const [existing] = await db
      .select()
      .from(feedbackVotes)
      .where(
        and(
          eq(feedbackVotes.feedbackId, data.feedbackId),
          eq(feedbackVotes.visitorId, data.visitorId),
        ),
      )
      .limit(1)

    if (existing) return err('Already voted')

    await db.insert(feedbackVotes).values(data)
    await db
      .update(feedbacks)
      .set({ votesCount: sql`${feedbacks.votesCount} + 1` })
      .where(eq(feedbacks.id, data.feedbackId))

    return ok(true)
  })

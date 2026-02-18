import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { feedbacks, feedbackVotes, projects } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import { createFeedbackSchema, voteFeedbackSchema } from '@/lib/validators'
import { authMiddleware } from '@/server/middleware/auth'

type Feedback = typeof feedbacks.$inferSelect

export const getFeedbacks = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((projectId: number) => projectId)
  .handler(async ({ data: projectId }): Promise<Result<Feedback[]>> => {
    const result = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.projectId, projectId))
      .orderBy(desc(feedbacks.votesCount))

    return ok(result)
  })

export const updateFeedbackStatus = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: number; status: string }) => data)
  .handler(async ({ data }): Promise<Result<Feedback>> => {
    const [updated] = await db
      .update(feedbacks)
      .set({ status: data.status as Feedback['status'] })
      .where(eq(feedbacks.id, data.id))
      .returning()

    if (!updated) return err('Feedback not found')
    return ok(updated)
  })

export const deleteFeedback = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ data: id }): Promise<Result<boolean>> => {
    const deleted = await db
      .delete(feedbacks)
      .where(eq(feedbacks.id, id))
      .returning()

    if (deleted.length === 0) return err('Feedback not found')
    return ok(true)
  })

// Public endpoints (no auth required)

export const getPublicFeedbacks = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<Result<{ project: typeof projects.$inferSelect; feedbacks: Feedback[] }>> => {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublic, true)))
      .limit(1)

    if (!project) return err('Project not found')

    const items = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.projectId, project.id))
      .orderBy(desc(feedbacks.votesCount))

    return ok({ project, feedbacks: items })
  })

export const submitFeedback = createServerFn({ method: 'POST' })
  .validator(createFeedbackSchema)
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
  .validator(voteFeedbackSchema)
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

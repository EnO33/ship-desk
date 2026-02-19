import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { changelogs, projects } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import { createChangelogSchema, updateChangelogSchema, paginatedSlugSchema, paginatedProjectSchema } from '@/lib/validators'
import { userMiddleware } from '@/server/middleware/auth'
import { assertProjectOwner } from '@/server/lib/assert-project-owner'

type Changelog = typeof changelogs.$inferSelect

export const getChangelogs = createServerFn({ method: 'GET' })
  .inputValidator(paginatedProjectSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<{ entries: Changelog[]; total: number; page: number; limit: number }>> => {
    const ownership = await assertProjectOwner(context.user.id, data.projectId)
    if (!ownership.ok) return ownership

    const page = data.page ?? 1
    const limit = data.limit ?? 20
    const offset = (page - 1) * limit

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(changelogs)
      .where(eq(changelogs.projectId, data.projectId))

    const entries = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.projectId, data.projectId))
      .orderBy(desc(changelogs.createdAt))
      .limit(limit)
      .offset(offset)

    return ok({ entries, total: countResult.count, page, limit })
  })

export const getChangelog = createServerFn({ method: 'GET' })
  .inputValidator((id: number) => id)
  .middleware([userMiddleware])
  .handler(async ({ data: id, context }): Promise<Result<Changelog>> => {
    const [entry] = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.id, id))
      .limit(1)

    if (!entry) return err('Changelog entry not found')

    const ownership = await assertProjectOwner(context.user.id, entry.projectId)
    if (!ownership.ok) return ownership

    return ok(entry)
  })

export const createChangelog = createServerFn({ method: 'POST' })
  .inputValidator(createChangelogSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<Changelog>> => {
    const ownership = await assertProjectOwner(context.user.id, data.projectId)
    if (!ownership.ok) return ownership

    const publishedAt =
      data.status === 'published' ? new Date() : undefined

    const [entry] = await db
      .insert(changelogs)
      .values({ ...data, publishedAt })
      .returning()

    if (!entry) return err('Failed to create changelog entry')
    return ok(entry)
  })

export const updateChangelog = createServerFn({ method: 'POST' })
  .inputValidator(updateChangelogSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<Changelog>> => {
    const { id, ...updates } = data

    const [existing] = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.id, id))
      .limit(1)

    if (!existing) return err('Changelog entry not found')

    const ownership = await assertProjectOwner(context.user.id, existing.projectId)
    if (!ownership.ok) return ownership

    const publishedAt =
      updates.status === 'published' ? new Date() : undefined

    const [entry] = await db
      .update(changelogs)
      .set({ ...updates, ...(publishedAt ? { publishedAt } : {}) })
      .where(eq(changelogs.id, id))
      .returning()

    if (!entry) return err('Changelog entry not found')
    return ok(entry)
  })

export const deleteChangelog = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .middleware([userMiddleware])
  .handler(async ({ data: id, context }): Promise<Result<boolean>> => {
    const [existing] = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.id, id))
      .limit(1)

    if (!existing) return err('Changelog entry not found')

    const ownership = await assertProjectOwner(context.user.id, existing.projectId)
    if (!ownership.ok) return ownership

    await db.delete(changelogs).where(eq(changelogs.id, id))
    return ok(true)
  })

export const getPublicChangelogs = createServerFn({ method: 'GET' })
  .inputValidator(paginatedSlugSchema)
  .handler(async ({ data }): Promise<Result<{ project: typeof projects.$inferSelect; entries: Changelog[]; total: number; page: number; limit: number }>> => {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, data.slug), eq(projects.isPublic, true)))
      .limit(1)

    if (!project) return err('Project not found')

    const page = data.page ?? 1
    const limit = data.limit ?? 20
    const offset = (page - 1) * limit

    const whereClause = and(
      eq(changelogs.projectId, project.id),
      eq(changelogs.status, 'published'),
    )

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(changelogs)
      .where(whereClause)

    const entries = await db
      .select()
      .from(changelogs)
      .where(whereClause)
      .orderBy(desc(changelogs.publishedAt))
      .limit(limit)
      .offset(offset)

    return ok({ project, entries, total: countResult.count, page, limit })
  })

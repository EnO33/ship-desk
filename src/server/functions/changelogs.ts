import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { changelogs, projects } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import { createChangelogSchema, updateChangelogSchema } from '@/lib/validators'
import { userMiddleware } from '@/server/middleware/auth'
import { assertProjectOwner } from '@/server/lib/assert-project-owner'

type Changelog = typeof changelogs.$inferSelect

export const getChangelogs = createServerFn({ method: 'GET' })
  .inputValidator((projectId: number) => projectId)
  .middleware([userMiddleware])
  .handler(async ({ data: projectId, context }): Promise<Result<Changelog[]>> => {
    const ownership = await assertProjectOwner(context.user.id, projectId)
    if (!ownership.ok) return ownership

    const result = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.projectId, projectId))
      .orderBy(desc(changelogs.createdAt))

    return ok(result)
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
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<Result<{ project: typeof projects.$inferSelect; entries: Changelog[] }>> => {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublic, true)))
      .limit(1)

    if (!project) return err('Project not found')

    const entries = await db
      .select()
      .from(changelogs)
      .where(
        and(
          eq(changelogs.projectId, project.id),
          eq(changelogs.status, 'published'),
        ),
      )
      .orderBy(desc(changelogs.publishedAt))

    return ok({ project, entries })
  })

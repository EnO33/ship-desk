import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { changelogs, projects } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import { createChangelogSchema, updateChangelogSchema } from '@/lib/validators'
import { authMiddleware } from '@/server/middleware/auth'

type Changelog = typeof changelogs.$inferSelect

export const getChangelogs = createServerFn({ method: 'GET' })
  .validator((projectId: number) => projectId)
  .middleware([authMiddleware])
  .handler(async ({ data: projectId }): Promise<Result<Changelog[]>> => {
    const result = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.projectId, projectId))
      .orderBy(desc(changelogs.createdAt))

    return ok(result)
  })

export const createChangelog = createServerFn({ method: 'POST' })
  .validator(createChangelogSchema)
  .middleware([authMiddleware])
  .handler(async ({ data }): Promise<Result<Changelog>> => {
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
  .validator(updateChangelogSchema)
  .middleware([authMiddleware])
  .handler(async ({ data }): Promise<Result<Changelog>> => {
    const { id, ...updates } = data
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
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ data: id }): Promise<Result<boolean>> => {
    const deleted = await db
      .delete(changelogs)
      .where(eq(changelogs.id, id))
      .returning()

    if (deleted.length === 0) return err('Changelog entry not found')
    return ok(true)
  })

export const getPublicChangelogs = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
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

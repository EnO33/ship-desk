import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { eq, and, ilike, desc, sql } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import { createProjectSchema, updateProjectSchema, paginatedSearchSchema } from '@/lib/validators'
import { userMiddleware } from '@/server/middleware/auth'
import { assertProjectOwner } from '@/server/lib/assert-project-owner'

type Project = typeof projects.$inferSelect

export const getProjects = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .handler(async ({ context }): Promise<Result<Project[]>> => {
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, context.user.id))
      .orderBy(projects.createdAt)

    return ok(result)
  })

export const getProject = createServerFn({ method: 'GET' })
  .inputValidator((projectId: string) => projectId)
  .middleware([userMiddleware])
  .handler(async ({ data: projectId, context }): Promise<Result<Project>> => {
    return assertProjectOwner(context.user.id, Number(projectId))
  })

export const createProject = createServerFn({ method: 'POST' })
  .inputValidator(createProjectSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<Project>> => {
    const [existing] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, data.slug))
      .limit(1)

    if (existing) return err('Slug already taken')

    const [project] = await db
      .insert(projects)
      .values({ ...data, userId: context.user.id })
      .returning()

    if (!project) return err('Failed to create project')
    return ok(project)
  })

export const updateProject = createServerFn({ method: 'POST' })
  .inputValidator(updateProjectSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<Project>> => {
    const { id, ...updates } = data

    const ownership = await assertProjectOwner(context.user.id, id)
    if (!ownership.ok) return ownership

    if (updates.slug && updates.slug !== ownership.data.slug) {
      const [existing] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.slug, updates.slug)))
        .limit(1)

      if (existing) return err('Slug already taken')
    }

    const [project] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning()

    if (!project) return err('Failed to update project')
    return ok(project)
  })

export const getPublicProjects = createServerFn({ method: 'GET' })
  .inputValidator(paginatedSearchSchema)
  .handler(async ({ data }): Promise<Result<{ projects: Project[]; total: number; page: number; limit: number }>> => {
    const page = data.page ?? 1
    const limit = data.limit ?? 12
    const offset = (page - 1) * limit

    const conditions = data.search
      ? and(eq(projects.isPublic, true), ilike(projects.name, `%${data.search}%`))
      : eq(projects.isPublic, true)

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(projects)
      .where(conditions)

    const items = await db
      .select()
      .from(projects)
      .where(conditions)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset)

    return ok({ projects: items, total: countResult.count, page, limit })
  })

export const deleteProject = createServerFn({ method: 'POST' })
  .inputValidator((projectId: number) => projectId)
  .middleware([userMiddleware])
  .handler(async ({ data: projectId, context }): Promise<Result<boolean>> => {
    const ownership = await assertProjectOwner(context.user.id, projectId)
    if (!ownership.ok) return ownership

    await db.delete(projects).where(eq(projects.id, projectId))
    return ok(true)
  })

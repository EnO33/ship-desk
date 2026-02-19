import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import { createProjectSchema, updateProjectSchema } from '@/lib/validators'
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

export const deleteProject = createServerFn({ method: 'POST' })
  .inputValidator((projectId: number) => projectId)
  .middleware([userMiddleware])
  .handler(async ({ data: projectId, context }): Promise<Result<boolean>> => {
    const ownership = await assertProjectOwner(context.user.id, projectId)
    if (!ownership.ok) return ownership

    await db.delete(projects).where(eq(projects.id, projectId))
    return ok(true)
  })

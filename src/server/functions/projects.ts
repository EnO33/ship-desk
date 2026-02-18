import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { projects, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import { createProjectSchema, updateProjectSchema } from '@/lib/validators'
import { authMiddleware } from '@/server/middleware/auth'

type Project = typeof projects.$inferSelect

export const getProjects = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Result<Project[]>> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, context.userId))
      .limit(1)

    if (!user) return err('User not found')

    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(projects.createdAt)

    return ok(result)
  })

export const getProject = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((projectId: string) => projectId)
  .handler(async ({ data: projectId, context }): Promise<Result<Project>> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, context.userId))
      .limit(1)

    if (!user) return err('User not found')

    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, Number(projectId)), eq(projects.userId, user.id)),
      )
      .limit(1)

    if (!project) return err('Project not found')
    return ok(project)
  })

export const createProject = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(createProjectSchema)
  .handler(async ({ data, context }): Promise<Result<Project>> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, context.userId))
      .limit(1)

    if (!user) return err('User not found')

    const [existing] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, data.slug))
      .limit(1)

    if (existing) return err('Slug already taken')

    const [project] = await db
      .insert(projects)
      .values({ ...data, userId: user.id })
      .returning()

    if (!project) return err('Failed to create project')
    return ok(project)
  })

export const deleteProject = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((projectId: number) => projectId)
  .handler(async ({ data: projectId, context }): Promise<Result<boolean>> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, context.userId))
      .limit(1)

    if (!user) return err('User not found')

    const deleted = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .returning()

    if (deleted.length === 0) return err('Project not found')
    return ok(true)
  })

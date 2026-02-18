import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { roadmapItems, projects } from '@/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import {
  createRoadmapItemSchema,
  updateRoadmapItemSchema,
} from '@/lib/validators'
import { authMiddleware } from '@/server/middleware/auth'

type RoadmapItem = typeof roadmapItems.$inferSelect

export const getRoadmapItems = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((projectId: number) => projectId)
  .handler(async ({ data: projectId }): Promise<Result<RoadmapItem[]>> => {
    const items = await db
      .select()
      .from(roadmapItems)
      .where(eq(roadmapItems.projectId, projectId))
      .orderBy(asc(roadmapItems.order), asc(roadmapItems.createdAt))

    return ok(items)
  })

export const createRoadmapItem = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(createRoadmapItemSchema)
  .handler(async ({ data }): Promise<Result<RoadmapItem>> => {
    const [item] = await db.insert(roadmapItems).values(data).returning()
    if (!item) return err('Failed to create roadmap item')
    return ok(item)
  })

export const updateRoadmapItem = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(updateRoadmapItemSchema)
  .handler(async ({ data }): Promise<Result<RoadmapItem>> => {
    const { id, ...updates } = data
    const [item] = await db
      .update(roadmapItems)
      .set(updates)
      .where(eq(roadmapItems.id, id))
      .returning()

    if (!item) return err('Roadmap item not found')
    return ok(item)
  })

export const deleteRoadmapItem = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ data: id }): Promise<Result<boolean>> => {
    const deleted = await db
      .delete(roadmapItems)
      .where(eq(roadmapItems.id, id))
      .returning()

    if (deleted.length === 0) return err('Roadmap item not found')
    return ok(true)
  })

export const getPublicRoadmap = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<Result<{ project: typeof projects.$inferSelect; items: RoadmapItem[] }>> => {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublic, true)))
      .limit(1)

    if (!project) return err('Project not found')

    const items = await db
      .select()
      .from(roadmapItems)
      .where(eq(roadmapItems.projectId, project.id))
      .orderBy(asc(roadmapItems.order), asc(roadmapItems.createdAt))

    return ok({ project, items })
  })

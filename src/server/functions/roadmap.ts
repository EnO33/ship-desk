import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { roadmapItems, projects } from '@/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'
import {
  createRoadmapItemSchema,
  updateRoadmapItemSchema,
  reorderRoadmapItemsSchema,
} from '@/lib/validators'
import { userMiddleware } from '@/server/middleware/auth'
import { assertProjectOwner } from '@/server/lib/assert-project-owner'

type RoadmapItem = typeof roadmapItems.$inferSelect

export const getRoadmapItems = createServerFn({ method: 'GET' })
  .inputValidator((projectId: number) => projectId)
  .middleware([userMiddleware])
  .handler(async ({ data: projectId, context }): Promise<Result<RoadmapItem[]>> => {
    const ownership = await assertProjectOwner(context.user.id, projectId)
    if (!ownership.ok) return ownership

    const items = await db
      .select()
      .from(roadmapItems)
      .where(eq(roadmapItems.projectId, projectId))
      .orderBy(asc(roadmapItems.order), asc(roadmapItems.createdAt))

    return ok(items)
  })

export const createRoadmapItem = createServerFn({ method: 'POST' })
  .inputValidator(createRoadmapItemSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<RoadmapItem>> => {
    const ownership = await assertProjectOwner(context.user.id, data.projectId)
    if (!ownership.ok) return ownership

    const [item] = await db.insert(roadmapItems).values(data).returning()
    if (!item) return err('Failed to create roadmap item')
    return ok(item)
  })

export const updateRoadmapItem = createServerFn({ method: 'POST' })
  .inputValidator(updateRoadmapItemSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<RoadmapItem>> => {
    const { id, ...updates } = data

    const [existing] = await db
      .select()
      .from(roadmapItems)
      .where(eq(roadmapItems.id, id))
      .limit(1)

    if (!existing) return err('Roadmap item not found')

    const ownership = await assertProjectOwner(context.user.id, existing.projectId)
    if (!ownership.ok) return ownership

    const [item] = await db
      .update(roadmapItems)
      .set(updates)
      .where(eq(roadmapItems.id, id))
      .returning()

    if (!item) return err('Roadmap item not found')
    return ok(item)
  })

export const deleteRoadmapItem = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .middleware([userMiddleware])
  .handler(async ({ data: id, context }): Promise<Result<boolean>> => {
    const [existing] = await db
      .select()
      .from(roadmapItems)
      .where(eq(roadmapItems.id, id))
      .limit(1)

    if (!existing) return err('Roadmap item not found')

    const ownership = await assertProjectOwner(context.user.id, existing.projectId)
    if (!ownership.ok) return ownership

    await db.delete(roadmapItems).where(eq(roadmapItems.id, id))
    return ok(true)
  })

export const reorderRoadmapItems = createServerFn({ method: 'POST' })
  .inputValidator(reorderRoadmapItemsSchema)
  .middleware([userMiddleware])
  .handler(async ({ data, context }): Promise<Result<boolean>> => {
    if (data.items.length === 0) return ok(true)

    // Verify ownership via the first item
    const [first] = await db
      .select()
      .from(roadmapItems)
      .where(eq(roadmapItems.id, data.items[0].id))
      .limit(1)

    if (!first) return err('Roadmap item not found')

    const ownership = await assertProjectOwner(context.user.id, first.projectId)
    if (!ownership.ok) return ownership

    for (const item of data.items) {
      await db
        .update(roadmapItems)
        .set({ status: item.status, order: item.order })
        .where(eq(roadmapItems.id, item.id))
    }

    return ok(true)
  })

export const getPublicRoadmap = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
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

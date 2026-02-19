import { db } from '@/db'
import { projects } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { ok, err, type Result } from '@/lib/result'

type Project = typeof projects.$inferSelect

export async function assertProjectOwner(
  userId: number,
  projectId: number,
): Promise<Result<Project>> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  if (!project) return err('Project not found')
  return ok(project)
}

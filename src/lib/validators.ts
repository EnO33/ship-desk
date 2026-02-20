import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional(),
})

export const updateProjectSchema = createProjectSchema
  .partial()
  .extend({ id: z.number() })

export const createChangelogSchema = z.object({
  projectId: z.number(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  version: z.string().max(50).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

export const updateChangelogSchema = createChangelogSchema
  .partial()
  .extend({ id: z.number() })

export const createRoadmapItemSchema = z.object({
  projectId: z.number(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['planned', 'in_progress', 'done']).default('planned'),
})

export const updateRoadmapItemSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['planned', 'in_progress', 'done']).optional(),
  order: z.number().optional(),
})

export const createFeedbackSchema = z.object({
  projectId: z.number(),
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email().optional().or(z.literal('')),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['feature', 'bug', 'improvement']).default('feature'),
})

export const voteFeedbackSchema = z.object({
  feedbackId: z.number(),
  visitorId: z.string().min(1),
})

export const paginatedSlugSchema = z.object({
  slug: z.string(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export const paginatedProjectSchema = z.object({
  projectId: z.number(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export const paginatedSearchSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(12),
  search: z.string().optional(),
})

export const reorderRoadmapItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      status: z.enum(['planned', 'in_progress', 'done']),
      order: z.number(),
    }),
  ),
})

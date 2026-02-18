import { pgTable, text, timestamp, serial, integer } from 'drizzle-orm/pg-core'
import { projects } from './projects'

export const roadmapItems = pgTable('roadmap_items', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['planned', 'in_progress', 'done'] })
    .default('planned')
    .notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

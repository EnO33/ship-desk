import { pgTable, text, timestamp, serial, integer } from 'drizzle-orm/pg-core'
import { projects } from './projects'

export const changelogs = pgTable('changelogs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  version: text('version'),
  status: text('status', { enum: ['draft', 'published'] })
    .default('draft')
    .notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

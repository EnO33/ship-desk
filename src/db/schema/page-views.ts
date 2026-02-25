import { pgTable, text, timestamp, serial, integer, index } from 'drizzle-orm/pg-core'
import { projects } from './projects'
import { changelogs } from './changelogs'

export const pageViews = pgTable(
  'page_views',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    page: text('page', { enum: ['changelog', 'roadmap', 'feedback', 'widget'] }).notNull(),
    changelogId: integer('changelog_id').references(() => changelogs.id, {
      onDelete: 'cascade',
    }),
    visitorId: text('visitor_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('page_views_project_created_idx').on(table.projectId, table.createdAt)],
)

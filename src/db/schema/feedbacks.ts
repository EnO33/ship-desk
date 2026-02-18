import { pgTable, text, timestamp, serial, integer } from 'drizzle-orm/pg-core'
import { projects } from './projects'

export const feedbacks = pgTable('feedbacks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email'),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category', { enum: ['feature', 'bug', 'improvement'] })
    .default('feature')
    .notNull(),
  status: text('status', {
    enum: ['open', 'under_review', 'planned', 'closed'],
  })
    .default('open')
    .notNull(),
  votesCount: integer('votes_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const feedbackVotes = pgTable('feedback_votes', {
  id: serial('id').primaryKey(),
  feedbackId: integer('feedback_id')
    .notNull()
    .references(() => feedbacks.id, { onDelete: 'cascade' }),
  visitorId: text('visitor_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

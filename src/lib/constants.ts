export const APP_NAME = 'ShipDesk'

export const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'de'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const FEEDBACK_CATEGORIES = [
  'feature',
  'bug',
  'improvement',
] as const
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export const FEEDBACK_STATUSES = [
  'open',
  'under_review',
  'planned',
  'closed',
] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export const ROADMAP_STATUSES = ['planned', 'in_progress', 'done'] as const
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number]

export const CHANGELOG_STATUSES = ['draft', 'published'] as const
export type ChangelogStatus = (typeof CHANGELOG_STATUSES)[number]

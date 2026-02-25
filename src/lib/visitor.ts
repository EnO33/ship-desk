import { nanoid } from 'nanoid'

export function getVisitorId(): string {
  const key = 'shipdesk_visitor_id'
  const stored = globalThis.document?.cookie
    ?.split('; ')
    .find((c) => c.startsWith(`${key}=`))
    ?.split('=')[1]

  if (stored) return stored

  const id = nanoid()
  if (globalThis.document) {
    document.cookie = `${key}=${id}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`
  }
  return id
}

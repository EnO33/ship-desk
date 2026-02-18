export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E }

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data })

export const err = <E = string>(error: E): Result<never, E> => ({
  ok: false,
  error,
})

export async function safeAsync<T>(
  promise: Promise<T>,
): Promise<Result<T, string>> {
  const result = await promise.then(
    (data) => ok(data),
    (error: unknown) =>
      err(error instanceof Error ? error.message : 'Unknown error'),
  )
  return result
}

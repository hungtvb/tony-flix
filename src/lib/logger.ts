/**
 * Structured one-line JSON logger for TonyFlix.
 *
 * Emits a single JSON object per event so it's trivially grep-able on Railway
 * and never leaks secrets — `redact` strips any field whose key smells like a
 * credential before serializing.
 */

type Level = 'info' | 'warn' | 'error'

const SENSITIVE_KEY = /pass|secret|token|cookie|hash|authorization/i

/** Returns a shallow copy with sensitive values replaced by '[redacted]'. */
export function redact<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : value
  }
  return out
}

function emit(level: Level, event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    lvl: level,
    event,
    ...redact(fields),
  })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const log = {
  info(event: string, fields?: Record<string, unknown>): void {
    emit('info', event, fields)
  },
  warn(event: string, fields?: Record<string, unknown>): void {
    emit('warn', event, fields)
  },
  error(event: string, fields?: Record<string, unknown>): void {
    emit('error', event, fields)
  },
}

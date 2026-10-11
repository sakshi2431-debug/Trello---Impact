const DAY_MS = 24 * 60 * 60 * 1000

export function toIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function todayIso() {
  return toIsoDate(new Date())
}

export type DueStatus = 'complete' | 'overdue' | 'due-soon' | 'upcoming'

export function getDueStatus(iso: string, isComplete: boolean): DueStatus {
  if (isComplete) return 'complete'
  const today = parseIsoDate(todayIso()).getTime()
  const due = parseIsoDate(iso).getTime()
  if (due < today) return 'overdue'
  if (due - today <= DAY_MS) return 'due-soon'
  return 'upcoming'
}

/** "Oct 14", or "Oct 14, 2027" when not in the current year (Trello style). */
export function formatShortDate(iso: string) {
  const date = parseIsoDate(iso)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

/** "15:36" → "3:36 PM" */
export function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** ISO date → "MM/DD/YYYY", the format Trello's date fields use. */
export function toFieldDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

/** "MM/DD/YYYY" (or M/D/YYYY) → ISO date, or undefined if it isn't a real date. */
export function fromFieldDate(text: string) {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return undefined
  const [, m, d, y] = match.map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return undefined
  return toIsoDate(date)
}

export function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

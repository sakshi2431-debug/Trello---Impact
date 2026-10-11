const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/**
 * A URL that is safe to use as a link's href, or undefined. A bare address gets https://. Anything that could run code
 * when clicked (javascript:, data:, vbscript:) is refused, including links saved before this check existed.
 */
export function safeLinkUrl(input: string | undefined): string | undefined {
  const text = input?.trim()
  if (!text) return undefined
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(withScheme)
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

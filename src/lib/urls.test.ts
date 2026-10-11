import { describe, expect, it } from 'vitest'
import { safeLinkUrl } from './urls'

describe('safeLinkUrl', () => {
  it('keeps web and email links', () => {
    expect(safeLinkUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
    expect(safeLinkUrl('http://example.com')).toBe('http://example.com/')
    expect(safeLinkUrl('mailto:ana@example.com')).toBe('mailto:ana@example.com')
  })

  it('adds https to a bare address', () => {
    expect(safeLinkUrl('  example.com/docs ')).toBe('https://example.com/docs')
  })

  it('refuses links that can run code', () => {
    for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)']) {
      expect(safeLinkUrl(bad)).toBeUndefined()
    }
  })

  it('refuses empty and malformed input', () => {
    expect(safeLinkUrl('')).toBeUndefined()
    expect(safeLinkUrl(undefined)).toBeUndefined()
    expect(safeLinkUrl('http://')).toBeUndefined()
  })
})

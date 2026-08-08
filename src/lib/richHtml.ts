import DOMPurify from 'dompurify'

/** Sanitize HTML from CKEditor while keeping design styles (color, font, align). */
export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['style', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

export function hasRichText(html?: string | null): boolean {
  if (!html?.trim()) return false
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 0
}

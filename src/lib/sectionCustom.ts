import {
  getSectionBackground,
  getSectionCustom,
  guestTypeLabel,
  mergeCoupleInfo,
  mergeHosts,
  SECTION_BG_LABELS,
  type InvitationResponse,
  type InvitationSettings,
  type SectionBackground,
  type SectionBgKey,
  type SectionCustomCode,
  type SectionCustomLibrary,
} from './invitationTypes'
import { buildExistingSectionSeed, isGenericStarterHtml } from './sectionCustomSeed'

export const SECTION_CUSTOM_MAX_CHARS = 200_000
export const SECTION_CUSTOM_MAX_LIBRARIES = 20
export const SECTION_CUSTOM_SANDBOX =
  'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox'

export type SectionCustomThemeBits = {
  tagColor: string
  pageTextColor: string
  fontFamily: string
}

export type SectionCustomPayload = {
  guest: { name: string; guest_type: string }
  event: {
    name: string
    event_date: string | null
    location: string | null
  }
  couple: ReturnType<typeof mergeCoupleInfo>
  hosts: ReturnType<typeof mergeHosts>
  schedules: InvitationResponse['event']['schedules']
  love_stories: InvitationResponse['event']['love_stories']
  gallery: InvitationResponse['event']['gallery']
  wishes: Array<{
    id: number
    guest_name: string
    message: string
    rsvp_status: string
    created_at?: string
  }>
  theme: SectionCustomThemeBits
  cover_title: string
  cover_subtitle: string
}

export const SECTION_CUSTOM_LIBRARY_PRESETS: SectionCustomLibrary[] = [
  {
    id: 'gsap-3',
    name: 'GSAP 3',
    src: 'https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js',
    kind: 'js',
  },
  {
    id: 'aos-css',
    name: 'AOS CSS',
    src: 'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css',
    kind: 'css',
  },
  {
    id: 'aos-js',
    name: 'AOS JS',
    src: 'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js',
    kind: 'js',
  },
  {
    id: 'splide-css',
    name: 'Splide CSS',
    src: 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4/dist/css/splide.min.css',
    kind: 'css',
  },
  {
    id: 'splide-js',
    name: 'Splide JS',
    src: 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4/dist/js/splide.min.js',
    kind: 'js',
  },
  {
    id: 'jquery-3',
    name: 'jQuery 3',
    src: 'https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js',
    kind: 'js',
  },
  {
    id: 'animate-css',
    name: 'Animate.css',
    src: 'https://cdn.jsdelivr.net/npm/animate.css@4/animate.min.css',
    kind: 'css',
  },
]

export function isHttpsLibraryUrl(src: string): boolean {
  const value = src.trim()
  if (!value) return false
  if (/\s/.test(value)) return false
  const lower = value.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function formatSectionCustomDate(eventDate: string | null | undefined): string {
  if (!eventDate) return '—'
  const parsed = new Date(eventDate)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeClosingTag(value: string, tag: string): string {
  const re = new RegExp(`</${tag}`, 'gi')
  return value.replace(re, `<\\/${tag}`)
}

export function buildSectionCustomPayload(
  data: InvitationResponse,
  theme: SectionCustomThemeBits,
): SectionCustomPayload {
  const couple = mergeCoupleInfo(data.event.couple_info)
  const settings = data.event.invitation_settings
  return {
    guest: {
      name: data.guest.name,
      guest_type: data.guest.guest_type,
    },
    event: {
      name: data.event.name,
      event_date: data.event.event_date ?? null,
      location: data.event.location ?? null,
    },
    couple,
    hosts: mergeHosts(data.event.hosts),
    schedules: data.event.schedules ?? [],
    love_stories: data.event.love_stories ?? [],
    gallery: data.event.gallery ?? [],
    wishes: (data.event.wishes ?? []).map((w) => ({
      id: w.id,
      guest_name: w.guest_name,
      message: w.message,
      rsvp_status: w.rsvp_status,
      created_at: w.created_at,
    })),
    theme,
    cover_title: settings?.cover_title ?? '',
    cover_subtitle: settings?.cover_subtitle ?? '',
  }
}

export function applySectionCustomPlaceholders(
  html: string,
  payload: SectionCustomPayload,
): string {
  const guestType = guestTypeLabel(payload.guest.guest_type)
  const when = formatSectionCustomDate(payload.event.event_date)
  const location = payload.event.location?.trim() || '—'
  const text: Record<string, string> = {
    guest_name: payload.guest.name,
    nama_tamu: payload.guest.name,
    guest_type: guestType,
    tipe_tamu: guestType,
    event_name: payload.event.name,
    nama_acara: payload.event.name,
    event_date: when,
    tanggal: when,
    event_location: location,
    lokasi: location,
    groom_name: payload.couple.groom?.full_name ?? '',
    groom_nickname: payload.couple.groom?.nickname ?? '',
    bride_name: payload.couple.bride?.full_name ?? '',
    bride_nickname: payload.couple.bride?.nickname ?? '',
    couple_initial: payload.couple.couple_initial ?? '',
    cover_title: payload.cover_title,
    cover_subtitle: payload.cover_subtitle,
  }
  const json: Record<string, unknown> = {
    couple_json: payload.couple,
    gallery_json: payload.gallery,
    schedules_json: payload.schedules,
    love_stories_json: payload.love_stories,
    hosts_json: payload.hosts,
    wishes_json: payload.wishes,
  }

  return html.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (full, rawKey: string) => {
    const key = rawKey.toLowerCase()
    if (key in text) return escapeHtml(text[key] ?? '')
    if (key in json) return JSON.stringify(json[key] ?? null)
    return full
  })
}

export function sectionCustomStarterHtml(sectionKey: string): string {
  const coverHint =
    sectionKey === 'cover'
      ? `\n  <p><button type="button" onclick="invitation.open()">Buka Undangan</button></p>`
      : ''
  return `<!-- Placeholder: {{guest_name}} {{nama_tamu}} {{groom_name}} {{bride_name}} {{event_name}} {{event_date}} {{gallery_json}} -->
<!-- JS: gunakan invitation.data. Cover: invitation.open() untuk buka undangan + musik -->
<section>
  <h1>{{event_name}}</h1>
  <p>Kepada Yth. {{guest_name}}</p>${coverHint}
</section>
`
}

export function normalizeSectionCustomLibraries(
  libraries: SectionCustomLibrary[] | undefined,
): SectionCustomLibrary[] {
  if (!Array.isArray(libraries)) return []
  const out: SectionCustomLibrary[] = []
  for (const lib of libraries) {
    if (out.length >= SECTION_CUSTOM_MAX_LIBRARIES) break
    if (!lib || typeof lib.src !== 'string') continue
    if (!isHttpsLibraryUrl(lib.src)) continue
    const kind = lib.kind === 'css' ? 'css' : 'js'
    out.push({
      id:
        typeof lib.id === 'string' && lib.id.trim()
          ? lib.id
          : `lib_${out.length}_${Date.now()}`,
      name: typeof lib.name === 'string' && lib.name.trim() ? lib.name : lib.src,
      src: lib.src.trim(),
      kind,
    })
  }
  return out
}

export function clampSectionCustomField(value: string): string {
  if (value.length <= SECTION_CUSTOM_MAX_CHARS) return value
  return value.slice(0, SECTION_CUSTOM_MAX_CHARS)
}

export function resolveSectionCustomVisual(
  settings: InvitationSettings | undefined,
  sectionKey: string,
): SectionBackground | undefined {
  if (!settings) return undefined
  if (!(sectionKey in SECTION_BG_LABELS)) return undefined
  return getSectionBackground(settings, sectionKey as SectionBgKey)
}

function buildVisualChrome(
  visual: SectionBackground | undefined,
  variant: 'content' | 'cover',
): { css: string; open: string; close: string } {
  const url = visual?.image_url?.trim() || ''
  const hasImage = Boolean(url)
  const minH =
    typeof visual?.min_height_px === 'number' && visual.min_height_px > 0
      ? visual.min_height_px
      : 0
  const lineH =
    typeof visual?.line_height === 'number' && visual.line_height > 0
      ? visual.line_height
      : 0
  const overlay = visual?.overlay ?? 0.25

  const sizeRules =
    variant === 'cover'
      ? 'html,body,#inv-visual-root{height:100%;min-height:100%;}'
      : minH
        ? `html,body,#inv-visual-root{min-height:${minH}px;}`
        : ''
  const centerRules =
    minH || variant === 'cover'
      ? '#inv-visual-root{display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;}'
      : ''
  const lineRules = lineH
    ? `#inv-visual-root,.inv-visual-content{line-height:${lineH};}`
    : ''
  const hideSeedBg = hasImage ? '.bg-img,.bg-overlay{display:none !important;}' : ''

  const css = `html,body{background:transparent;}#inv-visual-root{position:relative;width:100%;}#inv-visual-bg,#inv-visual-overlay{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;}#inv-visual-bg{object-fit:cover;}#inv-visual-overlay{background:#000;}#inv-visual-content{position:relative;z-index:1;width:100%;}${sizeRules}${centerRules}${lineRules}${hideSeedBg}`

  let bgHtml = ''
  if (hasImage) {
    bgHtml = `<img id="inv-visual-bg" src="${escapeHtml(url)}" alt="">`
    if (overlay > 0) {
      bgHtml += `<div id="inv-visual-overlay" style="opacity:${Math.min(overlay, 0.85)}"></div>`
    }
  }

  return {
    css,
    open: `<div id="inv-visual-root">${bgHtml}<div id="inv-visual-content" class="inv-visual-content">`,
    close: `</div></div>`,
  }
}

export function buildSectionCustomSrcdoc(input: {
  sectionKey: string
  html: string
  css: string
  js: string
  libraries: SectionCustomLibrary[]
  payload: SectionCustomPayload
  visual?: SectionBackground
  variant?: 'content' | 'cover'
}): string {
  const libs = normalizeSectionCustomLibraries(input.libraries)
  const cssLinks = libs
    .filter((l) => l.kind === 'css')
    .map((l) => `<link rel="stylesheet" href="${escapeHtml(l.src)}">`)
    .join('\n')
  const jsScripts = libs
    .filter((l) => l.kind === 'js')
    .map((l) => `<script src="${escapeHtml(l.src)}"></script>`)
    .join('\n')

  const bodyHtml = applySectionCustomPlaceholders(input.html, input.payload)
  const css = escapeClosingTag(input.css, 'style')
  const userJs = escapeClosingTag(input.js, 'script')
  const payloadJson = JSON.stringify(input.payload).replace(/</g, '\\u003c')
  const sectionKeyJson = JSON.stringify(input.sectionKey)
  const variant = input.variant === 'cover' ? 'cover' : 'content'
  const chrome = buildVisualChrome(input.visual, variant)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<base target="_blank">
<style>:root{--inv-tag:${escapeHtml(input.payload.theme.tagColor || '#be185d')};--inv-text:${escapeHtml(input.payload.theme.pageTextColor || '#1c1917')};--inv-font:${escapeHtml(input.payload.theme.fontFamily || 'serif')};}html,body{margin:0;padding:0;color:var(--inv-text);font-family:var(--inv-font);} img{max-width:100%;height:auto;}</style>
<style>${css}</style>
<style>${chrome.css}</style>
${cssLinks}
</head>
<body>
${chrome.open}
${bodyHtml}
${chrome.close}
<script>
(function(){
  var sectionKey = ${sectionKeyJson};
  function post(type, extra) {
    try {
      parent.postMessage(Object.assign({ source: 'inv-section', sectionKey: sectionKey, type: type }, extra || {}), '*');
    } catch (e) {}
  }
  window.invitation = {
    sectionKey: sectionKey,
    data: ${payloadJson},
    open: function() { post('open-cover'); }
  };
  window.onerror = function(msg) {
    post('error', { message: String(msg) });
  };
  function sendHeight() {
    var h = Math.max(
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0,
      1
    );
    post('resize', { height: h });
  }
  if (typeof ResizeObserver !== 'undefined') {
    try { new ResizeObserver(sendHeight).observe(document.documentElement); } catch (e) {}
  }
  window.addEventListener('load', sendHeight);
  setTimeout(sendHeight, 50);
  setTimeout(sendHeight, 400);
})();
</script>
${jsScripts}
<script>
(function(){
  try {
${userJs}
  } catch (err) {
    try {
      parent.postMessage({ source: 'inv-section', sectionKey: ${sectionKeyJson}, type: 'error', message: String(err && err.message ? err.message : err) }, '*');
    } catch (e) {}
  }
})();
</script>
</body>
</html>`
}

export function patchSectionCustomSettings(
  settings: InvitationSettings,
  key: string,
  patch: Partial<SectionCustomCode>,
  payload?: SectionCustomPayload,
): InvitationSettings {
  const current = getSectionCustom(settings, key)
  const next: SectionCustomCode = {
    ...current,
    ...patch,
    libraries: patch.libraries ?? current.libraries,
  }
  const shouldSeed =
    patch.mode === 'custom' &&
    (!current.html.trim() || isGenericStarterHtml(current.html))
  if (shouldSeed && payload) {
    const seed = buildExistingSectionSeed(key, settings, payload)
    next.html = seed.html
    if (!current.css.trim()) next.css = seed.css
    if (!current.js.trim()) next.js = seed.js
    if (!current.libraries.length) next.libraries = seed.libraries
  } else if (patch.mode === 'custom' && !current.html.trim()) {
    next.html = sectionCustomStarterHtml(key)
  }
  return {
    ...settings,
    section_custom: {
      ...(settings.section_custom ?? {}),
      [key]: next,
    },
  }
}

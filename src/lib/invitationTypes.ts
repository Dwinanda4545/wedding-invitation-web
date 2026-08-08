export type PersonInfo = {
  nickname?: string
  full_name?: string
  father?: string
  mother?: string
  city?: string
  photo_url?: string
}

export type CoupleInfo = {
  groom?: PersonInfo
  bride?: PersonInfo
  opening_quote?: string
  couple_initial?: string
}

export type SectionVisibility = {
  couple?: boolean
  schedule?: boolean
  love_story?: boolean
  gallery?: boolean
  wishes?: boolean
  hosts?: boolean
  qr?: boolean
}

export type BuiltinSectionKey = keyof SectionVisibility

/** Konfigurasi judul per section bawaan */
export type SectionTitleConfig = {
  /** Teks judul; kosong = pakai label default */
  text?: string
  /** Tampilkan judul section (default: true) */
  show?: boolean
}

/** Section kustom (HTML) yang bisa ditambah dinamis di mode Multi-section */
export type CustomSection = {
  id: string
  title: string
  content: string
  enabled: boolean
  sort_order: number
  /** Tampilkan judul section (default: true) */
  show_title?: boolean
}

export const BUILTIN_SECTION_KEYS: BuiltinSectionKey[] = [
  'couple',
  'schedule',
  'love_story',
  'gallery',
  'wishes',
  'hosts',
  'qr',
]

export const BUILTIN_SECTION_LABELS: Record<BuiltinSectionKey, string> = {
  couple: 'Mempelai',
  schedule: 'Detail Acara',
  love_story: 'Cerita Cinta',
  gallery: 'Galeri',
  wishes: 'Doa & Ucapan',
  hosts: 'Turut Mengundang',
  qr: 'QR Check-in',
}

export const DEFAULT_SECTION_ORDER: string[] = [...BUILTIN_SECTION_KEYS]

export function customSectionOrderKey(id: string): string {
  return `custom:${id}`
}

export function parseCustomSectionOrderKey(key: string): string | null {
  return key.startsWith('custom:') ? key.slice('custom:'.length) : null
}

export function createCustomSection(
  partial?: Partial<CustomSection>,
): CustomSection {
  const id =
    partial?.id ??
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `cs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`)

  return {
    id,
    title: partial?.title ?? 'Section baru',
    content: partial?.content ?? '<p>Tulis konten section di sini.</p>',
    enabled: partial?.enabled ?? true,
    sort_order: partial?.sort_order ?? 0,
    show_title: partial?.show_title ?? true,
  }
}

/**
 * Urutan section final: built-in + custom.
 * Menyisipkan custom baru sebelum QR jika belum ada di section_order.
 */
export function resolveSectionOrder(settings: InvitationSettings): string[] {
  const customs = settings.custom_sections ?? []
  const customKeys = new Set(customs.map((c) => customSectionOrderKey(c.id)))
  const builtinSet = new Set<string>(BUILTIN_SECTION_KEYS)

  let order =
    settings.section_order && settings.section_order.length > 0
      ? [...settings.section_order]
      : [...DEFAULT_SECTION_ORDER]

  order = order.filter(
    (key) => builtinSet.has(key) || customKeys.has(key),
  )

  for (const key of BUILTIN_SECTION_KEYS) {
    if (!order.includes(key)) {
      const qrIdx = order.indexOf('qr')
      if (qrIdx >= 0) order.splice(qrIdx, 0, key)
      else order.push(key)
    }
  }

  for (const custom of [...customs].sort(
    (a, b) => a.sort_order - b.sort_order,
  )) {
    const key = customSectionOrderKey(custom.id)
    if (!order.includes(key)) {
      const qrIdx = order.indexOf('qr')
      if (qrIdx >= 0) order.splice(qrIdx, 0, key)
      else order.push(key)
    }
  }

  return order
}

export type DecorSlot = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc'

export type DecorAsset = {
  id: string
  image_url: string
  preset_id?: string
  slot: DecorSlot
  width_percent: number
  opacity: number
  x_percent?: number
  y_percent?: number
}

/** mobile = rasio HP (~720px); existing = lebar penuh seperti sekarang */
export type ViewportMode = 'mobile' | 'existing'

export type SectionBgKey =
  | 'cover'
  | 'hero'
  | 'couple'
  | 'schedule'
  | 'love_story'
  | 'gallery'
  | 'wishes'
  | 'hosts'
  | 'qr'

export type SectionBackground = {
  image_url?: string
  overlay?: number
  /** Tinggi minimum section (px). Kosong/0 = menyesuaikan konten */
  min_height_px?: number
  /** Jarak baris konten section (CSS line-height), mis. 1.5 */
  line_height?: number
}

/** Opsi carousel Splide untuk section Galeri */
export type GallerySliderType = 'slide' | 'loop' | 'fade'
export type GallerySliderTheme = 'default' | 'skyblue' | 'sea-green' | 'soft-rose'

export type GallerySliderSettings = {
  /** Geser otomatis (default: true) */
  autoplay?: boolean
  /** Interval pindah slide dalam ms (default: 4000) */
  interval_ms?: number
  /** Tipe transisi Splide */
  type?: GallerySliderType
  /** Rewind ke awal (berguna untuk type slide/fade) */
  rewind?: boolean
  arrows?: boolean
  pagination?: boolean
  pause_on_hover?: boolean
  /** Jumlah slide terlihat */
  per_page?: 1 | 2 | 3
  gap_px?: number
  height_px?: number
  /** Preset visual (mengikuti tema Splide + soft-rose) */
  theme?: GallerySliderTheme
}

export const DEFAULT_GALLERY_SLIDER: Required<GallerySliderSettings> = {
  autoplay: true,
  interval_ms: 4000,
  type: 'loop',
  rewind: true,
  arrows: true,
  pagination: false,
  pause_on_hover: true,
  per_page: 1,
  gap_px: 12,
  height_px: 320,
  theme: 'soft-rose',
}

export const GALLERY_SLIDER_TYPE_LABELS: Record<GallerySliderType, string> = {
  slide: 'Slide',
  loop: 'Loop',
  fade: 'Fade',
}

export const GALLERY_SLIDER_THEME_LABELS: Record<GallerySliderTheme, string> = {
  default: 'Default (Splide)',
  skyblue: 'Skyblue (Splide)',
  'sea-green': 'Sea Green (Splide)',
  'soft-rose': 'Soft Rose',
}

export function mergeGallerySlider(
  partial?: GallerySliderSettings | null,
): Required<GallerySliderSettings> {
  const merged = {
    ...DEFAULT_GALLERY_SLIDER,
    ...partial,
  }
  const interval = Number(merged.interval_ms)
  merged.interval_ms = Number.isFinite(interval)
    ? Math.min(15000, Math.max(1000, interval))
    : DEFAULT_GALLERY_SLIDER.interval_ms
  const perPage = Number(merged.per_page)
  merged.per_page = ([1, 2, 3].includes(perPage) ? perPage : 1) as 1 | 2 | 3
  // fade tidak mendukung perPage > 1
  if (merged.type === 'fade') merged.per_page = 1
  return merged
}

export type InvitationSettings = {
  cover_enabled?: boolean
  cover_title?: string
  cover_subtitle?: string
  countdown_enabled?: boolean
  music_enabled?: boolean
  music_url?: string
  music_volume?: number
  sections?: SectionVisibility
  /** Judul & visibility judul untuk section bawaan */
  section_titles?: Partial<Record<BuiltinSectionKey, SectionTitleConfig>>
  /** Section HTML kustom (mode Multi-section) */
  custom_sections?: CustomSection[]
  /**
   * Urutan section: key built-in (`couple`, …) atau `custom:<id>`.
   * Jika kosong, memakai urutan default + custom sebelum QR.
   */
  section_order?: string[]
  /** Background halaman penuh (opsional, di belakang semua section) */
  background_image_url?: string
  background_overlay?: number
  /** Background khusus per section */
  section_backgrounds?: Partial<Record<SectionBgKey, SectionBackground>>
  /** Pengaturan Splide untuk section Galeri */
  gallery_slider?: GallerySliderSettings
  decor_assets?: DecorAsset[]
  viewport_mode?: ViewportMode
}

export const SECTION_BG_LABELS: Record<SectionBgKey, string> = {
  cover: 'Cover',
  hero: 'Hero / Pembuka',
  couple: 'Mempelai',
  schedule: 'Detail Acara',
  love_story: 'Cerita Cinta',
  gallery: 'Galeri',
  wishes: 'Doa & Ucapan',
  hosts: 'Turut Mengundang',
  qr: 'QR Check-in',
}

export type HostsInfo = {
  groom_side?: string[]
  bride_side?: string[]
}

export type EventSchedule = {
  id?: number
  title: string
  event_date?: string | null
  start_time?: string | null
  end_time?: string | null
  venue?: string | null
  address?: string | null
  maps_url?: string | null
  sort_order?: number
}

export type LoveStoryItem = {
  id?: number
  title: string
  date_label?: string | null
  story?: string | null
  sort_order?: number
}

export type GalleryImage = {
  id: number
  caption?: string | null
  sort_order?: number
  image_url: string
}

export type InvitationWish = {
  id: number
  guest_name: string
  message: string
  rsvp_status: 'pending' | 'attending' | 'not_attending'
  created_at?: string
}

export type InvitationEventData = {
  id: number
  name: string
  event_date?: string | null
  location?: string | null
  invitation_mode?: 'sections' | 'html'
  invitation_template?: string | null
  invitation_style?: Record<string, unknown> | null
  invitation_content?: string | null
  couple_info?: CoupleInfo | null
  invitation_settings?: InvitationSettings | null
  hosts?: HostsInfo | null
  schedules?: EventSchedule[]
  love_stories?: LoveStoryItem[]
  gallery?: GalleryImage[]
  wishes?: InvitationWish[]
}

export type InvitationGuestData = {
  id: number
  name: string
  guest_type: string
  secret_token?: string
  qr_code_url?: string | null
  is_attended?: boolean
  scanned_at?: string | null
}

export type InvitationResponse = {
  guest: InvitationGuestData
  event: InvitationEventData
}

export const DEFAULT_COUPLE_INFO: CoupleInfo = {
  groom: { nickname: '', full_name: '', father: '', mother: '', city: '' },
  bride: { nickname: '', full_name: '', father: '', mother: '', city: '' },
  opening_quote: '',
  couple_initial: '',
}

export const DEFAULT_INVITATION_SETTINGS: InvitationSettings = {
  cover_enabled: true,
  cover_title: 'Cherry Blossom',
  cover_subtitle: 'You are invited to our wedding',
  countdown_enabled: true,
  music_enabled: false,
  music_url: '',
  music_volume: 0.6,
  sections: {
    couple: true,
    schedule: true,
    love_story: true,
    gallery: true,
    wishes: true,
    hosts: true,
    qr: true,
  },
  section_titles: {},
  custom_sections: [],
  section_order: [...DEFAULT_SECTION_ORDER],
  background_image_url: '',
  background_overlay: 0.25,
  section_backgrounds: {},
  gallery_slider: { ...DEFAULT_GALLERY_SLIDER },
  decor_assets: [],
  viewport_mode: 'existing',
}

export const DEFAULT_HOSTS: HostsInfo = {
  groom_side: [],
  bride_side: [],
}

export function mergeSettings(
  partial?: InvitationSettings | null,
): InvitationSettings {
  const merged: InvitationSettings = {
    ...DEFAULT_INVITATION_SETTINGS,
    ...partial,
    sections: {
      ...DEFAULT_INVITATION_SETTINGS.sections,
      ...partial?.sections,
    },
    section_titles: {
      ...DEFAULT_INVITATION_SETTINGS.section_titles,
      ...partial?.section_titles,
    },
    custom_sections: partial?.custom_sections ?? [],
    section_order: partial?.section_order?.length
      ? partial.section_order
      : [...DEFAULT_SECTION_ORDER],
    decor_assets: partial?.decor_assets ?? [],
    section_backgrounds: partial?.section_backgrounds ?? {},
    gallery_slider: mergeGallerySlider(partial?.gallery_slider),
  }

  return {
    ...merged,
    section_order: resolveSectionOrder(merged),
  }
}

export function getSectionTitle(
  settings: InvitationSettings,
  key: BuiltinSectionKey,
): { text: string; show: boolean } {
  const cfg = settings.section_titles?.[key]
  const text = cfg?.text?.trim() || BUILTIN_SECTION_LABELS[key]
  return {
    text,
    show: cfg?.show !== false,
  }
}

export function getSectionBackground(
  settings: InvitationSettings,
  key: SectionBgKey,
): SectionBackground | undefined {
  const bg = settings.section_backgrounds?.[key]
  if (!bg) return undefined
  const hasImage = Boolean(bg.image_url?.trim())
  const hasHeight = typeof bg.min_height_px === 'number' && bg.min_height_px > 0
  const hasLineHeight = typeof bg.line_height === 'number' && bg.line_height > 0
  if (!hasImage && !hasHeight && !hasLineHeight) return undefined
  return {
    image_url: bg.image_url,
    overlay: bg.overlay ?? 0.25,
    min_height_px: bg.min_height_px,
    line_height: bg.line_height,
  }
}

export function getSectionLineHeight(
  settings: InvitationSettings,
  key: SectionBgKey,
): number | undefined {
  const value = settings.section_backgrounds?.[key]?.line_height
  if (typeof value !== 'number' || value <= 0) return undefined
  return value
}

export function mergeCoupleInfo(partial?: CoupleInfo | null): CoupleInfo {
  return {
    ...DEFAULT_COUPLE_INFO,
    ...partial,
    groom: { ...DEFAULT_COUPLE_INFO.groom, ...partial?.groom },
    bride: { ...DEFAULT_COUPLE_INFO.bride, ...partial?.bride },
  }
}

export function mergeHosts(partial?: HostsInfo | null): HostsInfo {
  return {
    groom_side: partial?.groom_side ?? [],
    bride_side: partial?.bride_side ?? [],
  }
}

export function formatEventDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: dateStr.includes('T') ? '2-digit' : undefined,
    minute: dateStr.includes('T') ? '2-digit' : undefined,
  })
}

export function formatScheduleDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTimeRange(
  start?: string | null,
  end?: string | null,
): string {
  if (!start && !end) return ''
  if (start && end) return `${start.slice(0, 5)} - ${end.slice(0, 5)} WIB`
  if (start) return `${start.slice(0, 5)} WIB`
  return `${end?.slice(0, 5)} WIB`
}

export function guestTypeLabel(type: string): string {
  return type === 'VIP' ? 'Tamu VIP' : 'Tamu'
}

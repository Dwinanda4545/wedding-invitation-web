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
  /** Background halaman penuh (opsional, di belakang semua section) */
  background_image_url?: string
  background_overlay?: number
  /** Background khusus per section */
  section_backgrounds?: Partial<Record<SectionBgKey, SectionBackground>>
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
  background_image_url: '',
  background_overlay: 0.25,
  section_backgrounds: {},
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
  return {
    ...DEFAULT_INVITATION_SETTINGS,
    ...partial,
    sections: {
      ...DEFAULT_INVITATION_SETTINGS.sections,
      ...partial?.sections,
    },
    decor_assets: partial?.decor_assets ?? [],
    section_backgrounds: partial?.section_backgrounds ?? {},
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
  if (!hasImage && !hasHeight) return undefined
  return {
    image_url: bg.image_url,
    overlay: bg.overlay ?? 0.25,
    min_height_px: bg.min_height_px,
  }
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

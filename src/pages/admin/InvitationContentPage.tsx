import DOMPurify from 'dompurify'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DecorEditorPanel } from './DecorEditorPanel'
import { SectionInvitation } from '../../components/invitation/SectionInvitation'
import type { InvitationResponse } from '../../lib/invitationTypes'
import {
  BUILTIN_TEMPLATES,
  DEFAULT_CUSTOM_STYLE,
  GENERIC_DEFAULT_CONTENT,
  type ApiInvitationThemeRow,
  type InvitationTheme,
  type ThemeStyle,
  customThemeFromApi,
  getInvitationTheme,
  replaceInvitationVariables,
  themePageStyle,
  themeQrCardStyle,
} from '../../lib/invitationTemplates'
import type {
  CoupleInfo,
  EventSchedule,
  GalleryImage,
  HostsInfo,
  InvitationSettings,
  LoveStoryItem,
} from '../../lib/invitationTypes'
import {
  DEFAULT_COUPLE_INFO,
  DEFAULT_HOSTS,
  DEFAULT_INVITATION_SETTINGS,
  mergeCoupleInfo,
  mergeHosts,
  mergeSettings,
} from '../../lib/invitationTypes'
import { api } from '../../lib/api'

type Tab = 'settings' | 'theme' | 'couple' | 'schedules' | 'stories' | 'gallery' | 'hosts' | 'desain'

const TABS: { id: Tab; label: string }[] = [
  { id: 'settings', label: 'Pengaturan' },
  { id: 'desain', label: 'Desain Visual' },
  { id: 'theme', label: 'Tema & HTML' },
  { id: 'couple', label: 'Mempelai' },
  { id: 'schedules', label: 'Jadwal Acara' },
  { id: 'stories', label: 'Cerita Cinta' },
  { id: 'gallery', label: 'Galeri' },
  { id: 'hosts', label: 'Turut Mengundang' },
]

const EMPTY_SCHEDULE: EventSchedule = {
  title: '',
  event_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  address: '',
  maps_url: '',
}

const EMPTY_STORY: LoveStoryItem = {
  title: '',
  date_label: '',
  story: '',
}

type CustomFormState = {
  dbId: number | null
  name: string
  description: string
  style: ThemeStyle
}

const EMPTY_CUSTOM_FORM: CustomFormState = {
  dbId: null,
  name: '',
  description: '',
  style: { ...DEFAULT_CUSTOM_STYLE },
}

const VARIABLES = [
  { key: '{{nama_tamu}}', label: 'Nama tamu' },
  { key: '{{tipe_tamu}}', label: 'Tipe tamu' },
  { key: '{{nama_acara}}', label: 'Nama acara' },
  { key: '{{tanggal}}', label: 'Tanggal' },
  { key: '{{lokasi}}', label: 'Lokasi' },
]

const STYLE_FIELDS: { key: keyof ThemeStyle; label: string; type: 'color' | 'text' }[] = [
  { key: 'pageBackground', label: 'Latar halaman', type: 'color' },
  { key: 'pageTextColor', label: 'Warna teks', type: 'color' },
  { key: 'tagColor', label: 'Warna tag/variabel (contoh: {{nama_acara}})', type: 'color' },
  { key: 'qrCardBackground', label: 'Latar kartu QR', type: 'text' },
  { key: 'qrCardBorder', label: 'Border kartu QR', type: 'color' },
  { key: 'qrHintColor', label: 'Warna hint QR', type: 'color' },
]

const FONT_FAMILY_OPTIONS = [
  { value: "Georgia, 'Times New Roman', serif", label: 'Serif klasik' },
  { value: "'Palatino Linotype', 'Book Antiqua', serif", label: 'Serif elegan' },
  { value: 'system-ui, sans-serif', label: 'Sans modern' },
  { value: "'Segoe UI', sans-serif", label: 'Sans bersih' },
  { value: 'cursive', label: 'Dekoratif' },
]

const FONT_SIZE_OPTIONS = [
  { value: '14px', label: 'Kecil (14px)' },
  { value: '16px', label: 'Sedang (16px)' },
  { value: '18px', label: 'Besar (18px)' },
  { value: '20px', label: 'Sangat besar (20px)' },
]

const FONT_WEIGHT_OPTIONS = [
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi-bold' },
  { value: '700', label: 'Bold' },
]

const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: 'Kiri' },
  { value: 'center', label: 'Tengah' },
  { value: 'right', label: 'Kanan' },
]

const LETTER_SPACING_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: '0.05em', label: 'Sedikit lebar' },
  { value: '0.1em', label: 'Lebar' },
  { value: '0.15em', label: 'Sangat lebar' },
]

function ThemeCard({
  theme,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  theme: InvitationTheme
  selected: boolean
  onSelect: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div
      className={[
        'relative rounded-2xl border p-4 transition',
        selected
          ? 'border-rose-400 ring-2 ring-rose-200'
          : 'border-stone-200 hover:border-stone-300',
      ].join(' ')}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div
          className="mb-3 flex h-20 items-center justify-center overflow-hidden rounded-xl px-2 text-xs font-medium"
          style={{
            background: theme.style.pageBackground,
            color: theme.style.pageTextColor,
            fontFamily: theme.style.fontFamily,
            fontSize: theme.style.fontSize,
            fontWeight: theme.style.fontWeight,
            textAlign: theme.style.textAlign,
            letterSpacing: theme.style.letterSpacing,
          }}
        >
          {theme.label}
        </div>
        <div className="font-medium text-stone-900">{theme.label}</div>
        <div className="mt-1 text-xs text-stone-500">{theme.description}</div>
      </button>
      {theme.isCustom && (onEdit || onDelete) && (
        <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
            >
              Ubah
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              Hapus
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function InvitationContentPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = Number(id)

  const [tab, setTab] = useState<Tab>('settings')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState<string | null>(null)
  const [eventLocation, setEventLocation] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState('cherry-blossom')
  const [invitationMode, setInvitationMode] = useState<'sections' | 'html'>('sections')
  const [content, setContent] = useState('')
  const [settings, setSettings] = useState<InvitationSettings>(DEFAULT_INVITATION_SETTINGS)
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo>(DEFAULT_COUPLE_INFO)
  const [hosts, setHosts] = useState<HostsInfo>(DEFAULT_HOSTS)
  const [schedules, setSchedules] = useState<EventSchedule[]>([])
  const [stories, setStories] = useState<LoveStoryItem[]>([])
  const [gallery, setGallery] = useState<GalleryImage[]>([])

  const [scheduleForm, setScheduleForm] = useState<EventSchedule>(EMPTY_SCHEDULE)
  const [storyForm, setStoryForm] = useState<LoveStoryItem>(EMPTY_STORY)
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)
  const [editingStoryId, setEditingStoryId] = useState<number | null>(null)

  const [customThemes, setCustomThemes] = useState<InvitationTheme[]>([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customForm, setCustomForm] = useState<CustomFormState>(EMPTY_CUSTOM_FORM)
  const [savingCustom, setSavingCustom] = useState(false)
  const [uploadingMusic, setUploadingMusic] = useState(false)

  const activeTemplate = useMemo(
    () => getInvitationTheme(templateId, null, customThemes),
    [templateId, customThemes],
  )

  const previewHtml = useMemo(() => {
    const replaced = replaceInvitationVariables(
      content,
      {
        guestName: 'Budi Santoso',
        guestType: 'VIP',
        eventName: eventName || 'Nama Acara',
        eventDate,
        eventLocation,
      },
      activeTemplate.style.tagColor,
    )
    return DOMPurify.sanitize(replaced)
  }, [content, eventName, eventDate, eventLocation, activeTemplate.style.tagColor])

  const loadCustomThemes = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: ApiInvitationThemeRow[] }>(
        '/api/invitation-themes',
      )
      setCustomThemes(data.data.map(customThemeFromApi))
    } catch {
      setError('Gagal memuat tema custom.')
    }
  }, [])

  const load = useCallback(async () => {
    if (!Number.isFinite(eventId)) return
    setError(null)
    try {
      const { data } = await api.get<{ data: Record<string, unknown> }>(
        `/api/events/${eventId}/invitation`,
      )
      const d = data.data
      setEventName(String(d.name ?? ''))
      setEventDate((d.event_date as string | null) ?? null)
      setEventLocation((d.location as string | null) ?? null)
      const tpl = String(d.invitation_template ?? 'cherry-blossom')
      setTemplateId(tpl)
      setInvitationMode((d.invitation_mode as 'sections' | 'html') ?? 'sections')
      setSettings(mergeSettings(d.invitation_settings as InvitationSettings))
      setCoupleInfo(mergeCoupleInfo(d.couple_info as CoupleInfo))
      setHosts(mergeHosts(d.hosts as HostsInfo))
      setSchedules((d.schedules as EventSchedule[]) ?? [])
      setStories((d.love_stories as LoveStoryItem[]) ?? [])
      setGallery((d.gallery as GalleryImage[]) ?? [])
      const theme = getInvitationTheme(tpl, d.invitation_style as Record<string, unknown>, customThemes)
      setContent((d.invitation_content as string | null) || theme.defaultContent)
    } catch {
      setError('Gagal memuat konten undangan.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  useEffect(() => {
    void load()
    void loadCustomThemes()
  }, [load, loadCustomThemes])

  function showToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2500)
  }

  async function saveMain(e?: FormEvent) {
    e?.preventDefault()
    if (!Number.isFinite(eventId)) return
    setSaving(true)
    setError(null)
    try {
      const theme = getInvitationTheme(templateId, null, customThemes)
      await api.put(`/api/events/${eventId}/invitation`, {
        invitation_mode: invitationMode,
        invitation_template: templateId,
        invitation_style: { theme: theme.id, label: theme.label, ...theme.style },
        invitation_content: content,
        couple_info: coupleInfo,
        invitation_settings: settings,
        hosts,
      })
      showToast('Konten undangan disimpan.')
    } catch {
      setError('Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  function applyTemplate(theme: InvitationTheme) {
    setTemplateId(theme.id)
    setContent(theme.defaultContent)
  }

  function insertVariable(key: string) {
    setContent((prev) => prev + key)
  }

  function openCreateCustomForm() {
    setCustomForm(EMPTY_CUSTOM_FORM)
    setShowCustomForm(true)
  }

  function openEditCustomForm(theme: InvitationTheme) {
    const dbId = Number(theme.id.replace('custom-', ''))
    if (!Number.isFinite(dbId)) return
    setCustomForm({
      dbId,
      name: theme.label,
      description: theme.description,
      style: { ...DEFAULT_CUSTOM_STYLE, ...theme.style },
    })
    setShowCustomForm(true)
  }

  async function saveCustomTheme(e: FormEvent) {
    e.preventDefault()
    if (!customForm.name.trim()) return
    setSavingCustom(true)
    setError(null)
    try {
      const payload = {
        name: customForm.name.trim(),
        description: customForm.description.trim() || null,
        style: customForm.style,
        default_content: GENERIC_DEFAULT_CONTENT,
      }

      if (customForm.dbId) {
        await api.put(`/api/invitation-themes/${customForm.dbId}`, payload)
      } else {
        await api.post('/api/invitation-themes', payload)
      }

      await loadCustomThemes()
      setShowCustomForm(false)
      setCustomForm(EMPTY_CUSTOM_FORM)
    } catch {
      setError('Gagal menyimpan tema custom.')
    } finally {
      setSavingCustom(false)
    }
  }

  async function removeCustomTheme(theme: InvitationTheme) {
    const dbId = Number(theme.id.replace('custom-', ''))
    if (!Number.isFinite(dbId)) return
    if (!window.confirm(`Hapus tema "${theme.label}"?`)) return
    setError(null)
    try {
      await api.delete(`/api/invitation-themes/${dbId}`)
      if (templateId === theme.id) {
        setTemplateId('classic')
        setContent(BUILTIN_TEMPLATES[0].defaultContent)
      }
      await loadCustomThemes()
    } catch {
      setError('Gagal menghapus tema custom.')
    }
  }

  async function saveSchedule(e: FormEvent) {
    e.preventDefault()
    if (!Number.isFinite(eventId) || !scheduleForm.title.trim()) return
    setError(null)
    try {
      if (editingScheduleId) {
        await api.put(`/api/events/${eventId}/schedules/${editingScheduleId}`, scheduleForm)
      } else {
        await api.post(`/api/events/${eventId}/schedules`, scheduleForm)
      }
      setScheduleForm(EMPTY_SCHEDULE)
      setEditingScheduleId(null)
      await load()
      showToast('Jadwal disimpan.')
    } catch {
      setError('Gagal menyimpan jadwal.')
    }
  }

  async function deleteSchedule(scheduleId: number) {
    if (!window.confirm('Hapus jadwal ini?')) return
    await api.delete(`/api/events/${eventId}/schedules/${scheduleId}`)
    await load()
  }

  async function saveStory(e: FormEvent) {
    e.preventDefault()
    if (!Number.isFinite(eventId) || !storyForm.title.trim()) return
    setError(null)
    try {
      if (editingStoryId) {
        await api.put(`/api/events/${eventId}/love-stories/${editingStoryId}`, storyForm)
      } else {
        await api.post(`/api/events/${eventId}/love-stories`, storyForm)
      }
      setStoryForm(EMPTY_STORY)
      setEditingStoryId(null)
      await load()
      showToast('Cerita disimpan.')
    } catch {
      setError('Gagal menyimpan cerita.')
    }
  }

  async function deleteStory(storyId: number) {
    if (!window.confirm('Hapus cerita ini?')) return
    await api.delete(`/api/events/${eventId}/love-stories/${storyId}`)
    await load()
  }

  async function uploadGallery(file: File | null) {
    if (!file || !Number.isFinite(eventId)) return
    const fd = new FormData()
    fd.append('image', file)
    try {
      await api.post(`/api/events/${eventId}/gallery`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await load()
      showToast('Foto diunggah.')
    } catch {
      setError('Gagal mengunggah foto.')
    }
  }

  async function deleteGallery(imageId: number) {
    if (!window.confirm('Hapus foto ini?')) return
    await api.delete(`/api/events/${eventId}/gallery/${imageId}`)
    await load()
  }

  async function uploadMusic(file: File | null) {
    if (!file || !Number.isFinite(eventId)) return
    setUploadingMusic(true)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post<{ data: { url: string } }>(
        `/api/events/${eventId}/music`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      setSettings((s) => ({ ...s, music_url: data.data.url, music_enabled: true }))
      showToast('Musik diunggah. Jangan lupa klik "Simpan pengaturan".')
    } catch {
      setError('Gagal mengunggah musik. Pastikan format MP3/WAV/OGG dan ukuran ≤ 10MB.')
    } finally {
      setUploadingMusic(false)
    }
  }

  function updatePerson(
    side: 'groom' | 'bride',
    field: string,
    value: string,
  ) {
    setCoupleInfo((prev) => ({
      ...prev,
      [side]: { ...prev[side], [field]: value },
    }))
  }

  function toggleSection(key: keyof NonNullable<InvitationSettings['sections']>) {
    setSettings((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: !(prev.sections?.[key] ?? true),
      },
    }))
  }

  function updateHostList(side: 'groom_side' | 'bride_side', text: string) {
    setHosts((prev) => ({
      ...prev,
      [side]: text.split('\n').map((l) => l.trim()).filter(Boolean),
    }))
  }

  if (!Number.isFinite(eventId)) {
    return <div className="text-red-600">ID acara tidak valid.</div>
  }

  if (loading) {
    return <div className="text-stone-600">Memuat konten undangan…</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link to="/admin/events" className="text-sm font-medium text-rose-700 hover:text-rose-800">
          ← Kembali ke acara
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-black">
          Kelola Undangan — {eventName}
        </h1>
        <p className="text-sm text-stone-600">
          Atur tema, HTML, dan semua section undangan (cover, mempelai, jadwal, galeri, RSVP) di satu tempat.
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              tab === t.id ? 'bg-rose-100 text-rose-900' : 'text-stone-600 hover:bg-stone-100',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {tab === 'settings' && (
        <form onSubmit={saveMain} className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-xs font-medium text-stone-600">Mode undangan</label>
            <select
              className="mt-1 w-full max-w-xs rounded-lg border border-stone-200 px-3 py-2 text-sm"
              value={invitationMode}
              onChange={(e) => setInvitationMode(e.target.value as 'sections' | 'html')}
            >
              <option value="sections">Multi-section (Kadio)</option>
              <option value="html">HTML custom (lihat tab Tema & HTML)</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.cover_enabled ?? true}
                onChange={(e) => setSettings((s) => ({ ...s, cover_enabled: e.target.checked }))}
              />
              Cover / Buka Undangan
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.countdown_enabled ?? true}
                onChange={(e) => setSettings((s) => ({ ...s, countdown_enabled: e.target.checked }))}
              />
              Countdown timer
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.music_enabled ?? false}
                onChange={(e) => setSettings((s) => ({ ...s, music_enabled: e.target.checked }))}
              />
              Musik latar
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-stone-600">Judul cover</label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                value={settings.cover_title ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, cover_title: e.target.value }))}
                placeholder="Cherry Blossom"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">Subjudul cover</label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                value={settings.cover_subtitle ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, cover_subtitle: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div>
                <label className="text-xs font-medium text-stone-600">URL musik (MP3)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  value={settings.music_url ?? ''}
                  onChange={(e) => setSettings((s) => ({ ...s, music_url: e.target.value }))}
                  placeholder="https://... atau unggah file di bawah"
                />
              </div>

              <div>
                <label className="cursor-pointer rounded-lg border border-dashed border-stone-300 bg-white px-4 py-3 text-center text-xs text-stone-600 hover:bg-stone-50 flex items-center justify-center gap-2">
                  {uploadingMusic ? 'Mengunggah…' : '+ Unggah file musik (MP3/WAV, maks 10MB)'}
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
                    className="hidden"
                    disabled={uploadingMusic}
                    onChange={(e) => void uploadMusic(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {settings.music_url && (
                <audio controls src={settings.music_url} className="w-full" />
              )}

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-stone-600">Volume default</label>
                  <span className="text-xs text-stone-500">
                    {Math.round((settings.music_volume ?? 0.6) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  className="mt-1 w-full accent-rose-600"
                  value={settings.music_volume ?? 0.6}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, music_volume: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-stone-600">Tampilkan section</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {(['couple', 'schedule', 'love_story', 'gallery', 'wishes', 'hosts', 'qr'] as const).map(
                (key) => (
                  <label key={key} className="flex items-center gap-2 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={settings.sections?.[key] !== false}
                      onChange={() => toggleSection(key)}
                    />
                    {key.replace('_', ' ')}
                  </label>
                ),
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Menyimpan…' : 'Simpan pengaturan'}
          </button>
        </form>
      )}

      {tab === 'theme' && (
        <div className="space-y-8">
          <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Tema custom</h2>
                <p className="mt-1 text-xs text-stone-500">
                  Buat tema dengan warna sendiri. Tema tersimpan untuk semua acara.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateCustomForm}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
              >
                + Tambah tema custom
              </button>
            </div>

            {showCustomForm && (
              <form
                onSubmit={saveCustomTheme}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4"
              >
                <h3 className="text-sm font-semibold text-stone-900">
                  {customForm.dbId ? 'Ubah tema custom' : 'Tema custom baru'}
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-stone-600">Nama tema</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      value={customForm.name}
                      onChange={(e) => setCustomForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Tema Garden"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-600">Deskripsi</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      value={customForm.description}
                      onChange={(e) =>
                        setCustomForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Nuansa hijau natural"
                    />
                  </div>
                  {STYLE_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="text-xs font-medium text-stone-600">{field.label}</label>
                      <div className="mt-1 flex gap-2">
                        {field.type === 'color' && (
                          <input
                            type="color"
                            className="h-10 w-12 shrink-0 cursor-pointer rounded border border-stone-200"
                            value={
                              customForm.style[field.key].startsWith('#')
                                ? customForm.style[field.key]
                                : '#000000'
                            }
                            onChange={(e) =>
                              setCustomForm((f) => ({
                                ...f,
                                style: { ...f.style, [field.key]: e.target.value },
                              }))
                            }
                          />
                        )}
                        <input
                          className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono text-xs"
                          value={customForm.style[field.key]}
                          onChange={(e) =>
                            setCustomForm((f) => ({
                              ...f,
                              style: { ...f.style, [field.key]: e.target.value },
                            }))
                          }
                          placeholder={
                            field.key === 'pageBackground'
                              ? '#1e3a5f atau linear-gradient(...)'
                              : '#ffffff'
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-stone-200 pt-6">
                  <h4 className="text-sm font-semibold text-stone-900">Gaya teks</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-stone-600">Jenis font</label>
                      <select
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                        value={customForm.style.fontFamily}
                        onChange={(e) =>
                          setCustomForm((f) => ({
                            ...f,
                            style: { ...f.style, fontFamily: e.target.value },
                          }))
                        }
                      >
                        {FONT_FAMILY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-600">Ukuran teks</label>
                      <select
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                        value={customForm.style.fontSize}
                        onChange={(e) =>
                          setCustomForm((f) => ({
                            ...f,
                            style: { ...f.style, fontSize: e.target.value },
                          }))
                        }
                      >
                        {FONT_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-600">Ketebalan teks</label>
                      <select
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                        value={customForm.style.fontWeight}
                        onChange={(e) =>
                          setCustomForm((f) => ({
                            ...f,
                            style: { ...f.style, fontWeight: e.target.value },
                          }))
                        }
                      >
                        {FONT_WEIGHT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-600">Perataan teks</label>
                      <select
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                        value={customForm.style.textAlign}
                        onChange={(e) =>
                          setCustomForm((f) => ({
                            ...f,
                            style: {
                              ...f.style,
                              textAlign: e.target.value as ThemeStyle['textAlign'],
                            },
                          }))
                        }
                      >
                        {TEXT_ALIGN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-stone-600">Jarak antar huruf</label>
                      <select
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                        value={customForm.style.letterSpacing}
                        onChange={(e) =>
                          setCustomForm((f) => ({
                            ...f,
                            style: { ...f.style, letterSpacing: e.target.value },
                          }))
                        }
                      >
                        {LETTER_SPACING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-4 rounded-xl p-4 text-sm"
                  style={{
                    background: customForm.style.pageBackground,
                    color: customForm.style.pageTextColor,
                    fontFamily: customForm.style.fontFamily,
                    fontSize: customForm.style.fontSize,
                    fontWeight: customForm.style.fontWeight,
                    textAlign: customForm.style.textAlign,
                    letterSpacing: customForm.style.letterSpacing,
                  }}
                >
                  <p className="font-semibold">Pratinjau — {customForm.name || 'Tema baru'}</p>
                  <p className="mt-2 opacity-90">Contoh teks undangan digital untuk acara pernikahan.</p>
                  <p className="mt-2 opacity-90">
                    Nama acara:{' '}
                    <span style={{ color: customForm.style.tagColor }} className="font-semibold">
                      {'{{nama_acara}}'}
                    </span>
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={savingCustom}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {savingCustom ? 'Menyimpan…' : 'Simpan tema'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomForm(false)
                      setCustomForm(EMPTY_CUSTOM_FORM)
                    }}
                    className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {customThemes.length === 0 && !showCustomForm ? (
              <p className="text-sm text-stone-500">
                Belum ada tema custom. Klik tombol di atas untuk membuat.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {customThemes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    selected={templateId === theme.id}
                    onSelect={() => applyTemplate(theme)}
                    onEdit={() => openEditCustomForm(theme)}
                    onDelete={() => void removeCustomTheme(theme)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-stone-900">Tema bawaan</h2>
            <p className="mt-1 text-xs text-stone-500">
              Template siap pakai, termasuk Cherry Blossom untuk nuansa sakura.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BUILTIN_TEMPLATES.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  selected={templateId === theme.id}
                  onSelect={() => applyTemplate(theme)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">
                  Konten undangan (HTML — dipakai saat mode "HTML custom")
                </h2>
                <p className="mt-1 text-xs text-stone-500">
                  Gunakan variabel di bawah untuk personalisasi per tamu.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <textarea
                className="min-h-[320px] w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-xs text-stone-800 outline-none ring-rose-200 focus:ring-2"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-stone-900">Pratinjau</h2>
              <div
                className="min-h-[320px] overflow-hidden rounded-2xl border border-stone-200"
                style={themePageStyle(activeTemplate)}
              >
                <div className="p-6">
                  <div
                    className="invitation-content"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                  <div className="mt-6" style={themeQrCardStyle(activeTemplate)}>
                    <div className="mx-auto max-w-[120px] rounded-xl bg-white p-2">
                      <div className="aspect-square rounded bg-stone-100" />
                    </div>
                    <p
                      className="mt-2 text-center text-[10px]"
                      style={{ color: activeTemplate.style.qrHintColor }}
                    >
                      Area QR check-in
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void saveMain()}
            disabled={saving}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Menyimpan…' : 'Simpan tema & HTML'}
          </button>
        </div>
      )}

      {tab === 'couple' && (
        <form onSubmit={saveMain} className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            {(['groom', 'bride'] as const).map((side) => (
              <div key={side} className="space-y-3">
                <h3 className="font-semibold text-stone-900">
                  {side === 'groom' ? 'Mempelai Pria' : 'Mempelai Wanita'}
                </h3>
                {(['nickname', 'full_name', 'father', 'mother', 'city', 'photo_url'] as const).map(
                  (field) => (
                    <div key={field}>
                      <label className="text-xs text-stone-500">{field.replace('_', ' ')}</label>
                      <input
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                        value={coupleInfo[side]?.[field] ?? ''}
                        onChange={(e) => updatePerson(side, field, e.target.value)}
                      />
                    </div>
                  ),
                )}
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-stone-500">Inisial pasangan (U & B)</label>
              <input
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                value={coupleInfo.couple_initial ?? ''}
                onChange={(e) => setCoupleInfo((c) => ({ ...c, couple_initial: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-stone-500">Quotes / ayat pembuka</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                rows={3}
                value={coupleInfo.opening_quote ?? ''}
                onChange={(e) => setCoupleInfo((c) => ({ ...c, opening_quote: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
            Simpan mempelai
          </button>
        </form>
      )}

      {tab === 'schedules' && (
        <div className="space-y-6">
          <form onSubmit={saveSchedule} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">{editingScheduleId ? 'Ubah jadwal' : 'Tambah jadwal acara'}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Judul (Akad, Resepsi…)" value={scheduleForm.title} onChange={(e) => setScheduleForm((f) => ({ ...f, title: e.target.value }))} required />
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={scheduleForm.event_date ?? ''} onChange={(e) => setScheduleForm((f) => ({ ...f, event_date: e.target.value }))} />
              <input type="time" className="rounded-lg border px-3 py-2 text-sm" value={scheduleForm.start_time ?? ''} onChange={(e) => setScheduleForm((f) => ({ ...f, start_time: e.target.value }))} />
              <input type="time" className="rounded-lg border px-3 py-2 text-sm" value={scheduleForm.end_time ?? ''} onChange={(e) => setScheduleForm((f) => ({ ...f, end_time: e.target.value }))} />
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Venue" value={scheduleForm.venue ?? ''} onChange={(e) => setScheduleForm((f) => ({ ...f, venue: e.target.value }))} />
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Alamat" value={scheduleForm.address ?? ''} onChange={(e) => setScheduleForm((f) => ({ ...f, address: e.target.value }))} />
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Google Maps URL" value={scheduleForm.maps_url ?? ''} onChange={(e) => setScheduleForm((f) => ({ ...f, maps_url: e.target.value }))} />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Simpan</button>
              {editingScheduleId && (
                <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => { setEditingScheduleId(null); setScheduleForm(EMPTY_SCHEDULE) }}>Batal</button>
              )}
            </div>
          </form>
          <ul className="space-y-2">
            {schedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm">
                <span>{s.title} — {s.event_date ?? '—'}</span>
                <div className="flex gap-2">
                  <button type="button" className="text-rose-700" onClick={() => { setEditingScheduleId(s.id ?? null); setScheduleForm(s) }}>Ubah</button>
                  <button type="button" className="text-red-600" onClick={() => s.id && void deleteSchedule(s.id)}>Hapus</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'stories' && (
        <div className="space-y-6">
          <form onSubmit={saveStory} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">{editingStoryId ? 'Ubah cerita' : 'Tambah cerita cinta'}</h3>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Judul (Kenalan, Jadian…)" value={storyForm.title} onChange={(e) => setStoryForm((f) => ({ ...f, title: e.target.value }))} required />
              <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Tanggal / label" value={storyForm.date_label ?? ''} onChange={(e) => setStoryForm((f) => ({ ...f, date_label: e.target.value }))} />
              <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} placeholder="Cerita" value={storyForm.story ?? ''} onChange={(e) => setStoryForm((f) => ({ ...f, story: e.target.value }))} />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Simpan</button>
              {editingStoryId && (
                <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => { setEditingStoryId(null); setStoryForm(EMPTY_STORY) }}>Batal</button>
              )}
            </div>
          </form>
          <ul className="space-y-2">
            {stories.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm">
                <span>{s.title} — {s.date_label}</span>
                <div className="flex gap-2">
                  <button type="button" className="text-rose-700" onClick={() => { setEditingStoryId(s.id ?? null); setStoryForm(s) }}>Ubah</button>
                  <button type="button" className="text-red-600" onClick={() => s.id && void deleteStory(s.id)}>Hapus</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'gallery' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <label className="cursor-pointer rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-600 hover:bg-stone-50">
            + Unggah foto galeri (max 2MB)
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void uploadGallery(e.target.files?.[0] ?? null)} />
          </label>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl border">
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                <button type="button" className="absolute right-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs text-white" onClick={() => void deleteGallery(img.id)}>Hapus</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'hosts' && (
        <form onSubmit={saveMain} className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <label className="text-sm font-semibold">Kel. Mempelai Pria (satu baris per nama)</label>
            <textarea
              className="mt-2 min-h-[200px] w-full rounded-lg border px-3 py-2 text-sm"
              value={(hosts.groom_side ?? []).join('\n')}
              onChange={(e) => updateHostList('groom_side', e.target.value)}
            />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <label className="text-sm font-semibold">Kel. Mempelai Wanita (satu baris per nama)</label>
            <textarea
              className="mt-2 min-h-[200px] w-full rounded-lg border px-3 py-2 text-sm"
              value={(hosts.bride_side ?? []).join('\n')}
              onChange={(e) => updateHostList('bride_side', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
              Simpan daftar undangan
            </button>
          </div>
        </form>
      )}

      {tab === 'desain' && (
        <DesainVisualTab
          eventId={eventId}
          eventName={eventName}
          eventDate={eventDate}
          eventLocation={eventLocation}
          templateId={templateId}
          customThemes={customThemes}
          settings={settings}
          schedules={schedules}
          stories={stories}
          gallery={gallery}
          coupleInfo={coupleInfo}
          hosts={hosts}
          saving={saving}
          onSettingsChange={setSettings}
          onSave={saveMain}
        />
      )}
    </div>
  )
}

/* ── Desain Visual tab (isolated to keep InvitationContentPage lean) ── */
type DesainTabProps = {
  eventId: number
  eventName: string
  eventDate: string | null
  eventLocation: string | null
  templateId: string
  customThemes: InvitationTheme[]
  settings: import('../../lib/invitationTypes').InvitationSettings
  schedules: import('../../lib/invitationTypes').EventSchedule[]
  stories: import('../../lib/invitationTypes').LoveStoryItem[]
  gallery: import('../../lib/invitationTypes').GalleryImage[]
  coupleInfo: import('../../lib/invitationTypes').CoupleInfo
  hosts: import('../../lib/invitationTypes').HostsInfo
  saving: boolean
  onSettingsChange: (s: import('../../lib/invitationTypes').InvitationSettings) => void
  onSave: () => Promise<void>
}

function DesainVisualTab({
  eventId,
  eventName,
  eventDate,
  eventLocation,
  templateId,
  customThemes,
  settings,
  schedules,
  stories,
  gallery,
  coupleInfo,
  hosts,
  saving,
  onSettingsChange,
  onSave,
}: DesainTabProps) {
  const [fullPreview, setFullPreview] = useState(false)

  const theme = useMemo(
    () => getInvitationTheme(templateId, null, customThemes),
    [templateId, customThemes],
  )

  const invitationStyle = useMemo(
    () => ({
      theme: theme.id,
      label: theme.label,
      ...theme.style,
    }),
    [theme],
  )

  /** Preview mini di panel: cover terbuka, musik off */
  const panelPreviewData: InvitationResponse = useMemo(
    () => ({
      guest: {
        id: 0,
        name: 'Tamu Preview',
        guest_type: 'VIP',
        secret_token: '',
        qr_code_url: null,
      },
      event: {
        id: eventId,
        name: eventName || 'Nama Acara',
        event_date: eventDate,
        location: eventLocation,
        invitation_mode: 'sections',
        invitation_template: templateId,
        invitation_style: invitationStyle,
        invitation_content: null,
        couple_info: coupleInfo,
        invitation_settings: {
          ...settings,
          music_enabled: false,
        },
        hosts,
        schedules,
        love_stories: stories,
        gallery,
        wishes: [],
      },
    }),
    [
      eventId,
      eventName,
      eventDate,
      eventLocation,
      templateId,
      invitationStyle,
      settings,
      coupleInfo,
      hosts,
      schedules,
      stories,
      gallery,
    ],
  )

  /** Full preview: sama seperti tampilan undangan tamu (cover + musik aktif) */
  const fullPreviewData: InvitationResponse = useMemo(
    () => ({
      ...panelPreviewData,
      event: {
        ...panelPreviewData.event,
        invitation_settings: settings,
      },
    }),
    [panelPreviewData, settings],
  )

  useEffect(() => {
    if (!fullPreview) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFullPreview(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [fullPreview])

  // Preview panel diperkecil; konten tetap di kanvas 720px lalu di-scale
  const previewScale = 0.5
  const previewCanvasW = 720
  const previewFrameW = previewCanvasW * previewScale
  const previewFrameH = 640

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <DecorEditorPanel
          eventId={eventId}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onSave={onSave}
          saving={saving}
        />
      </div>

      <div className="lg:sticky lg:top-6 self-start">
        <div
          className="mx-auto overflow-hidden rounded-[1.75rem] shadow-2xl ring-1 ring-stone-300"
          style={{ width: previewFrameW, height: previewFrameH }}
        >
          <div
            className="relative z-20 flex items-center justify-between gap-2 border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{
              background: theme.style.pageBackground.includes('gradient')
                ? 'rgba(0,0,0,0.55)'
                : theme.style.pageTextColor,
              color: theme.style.pageBackground.includes('gradient')
                ? '#fff'
                : theme.style.pageBackground,
              borderColor: 'rgba(0,0,0,0.08)',
            }}
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
                aria-hidden
              />
              Preview · {theme.label}
            </span>
          </div>

          <div
            className="relative overflow-hidden"
            style={{
              height: `calc(100% - 2.25rem)`,
              background: theme.style.pageBackground,
              color: theme.style.pageTextColor,
              fontFamily: theme.style.fontFamily,
            }}
          >
            <div
              className="origin-top-left overflow-y-auto overflow-x-hidden"
              style={{
                width: previewCanvasW,
                height: (previewFrameH - 36) / previewScale,
                transform: `scale(${previewScale})`,
              }}
            >
              <SectionInvitation
                data={panelPreviewData}
                secretToken=""
                previewMode
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFullPreview(true)}
          className="mt-3 w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-stone-800"
        >
          Mode tampilan penuh
        </button>
        <p className="mt-2 text-center text-[11px] text-stone-400">
          Pratinjau diperkecil (kanvas 720px). Gunakan tampilan penuh untuk edit posisi.
        </p>
      </div>

      {fullPreview && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="relative z-[110] flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/80 px-4 py-2.5 text-white backdrop-blur-md">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                Preview · Tampilan penuh
              </div>
              <p className="mt-1 text-[11px] font-normal normal-case tracking-normal text-white/70">
                Geser asset dekoratif untuk mengatur posisi. Klik Simpan Desain setelah menutup.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg bg-white/10 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    onSettingsChange({ ...settings, viewport_mode: 'mobile' })
                  }
                  className={[
                    'rounded-md px-3 py-1.5 font-medium transition',
                    (settings.viewport_mode ?? 'existing') === 'mobile'
                      ? 'bg-white text-stone-900'
                      : 'text-white/80 hover:text-white',
                  ].join(' ')}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSettingsChange({ ...settings, viewport_mode: 'existing' })
                  }
                  className={[
                    'rounded-md px-3 py-1.5 font-medium transition',
                    (settings.viewport_mode ?? 'existing') === 'existing'
                      ? 'bg-white text-stone-900'
                      : 'text-white/80 hover:text-white',
                  ].join(' ')}
                >
                  Existing
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFullPreview(false)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
              >
                Tutup (Esc)
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <SectionInvitation
              key={`full-preview-${settings.viewport_mode ?? 'existing'}`}
              data={fullPreviewData}
              secretToken=""
              editDecor
              onDecorAssetsChange={(assets) =>
                onSettingsChange({ ...settings, decor_assets: assets })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

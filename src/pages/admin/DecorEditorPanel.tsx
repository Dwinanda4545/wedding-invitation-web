import { useRef, useState } from 'react'
import type {
  DecorAsset,
  DecorSlot,
  InvitationSettings,
  SectionBgKey,
  ViewportMode,
} from '../../lib/invitationTypes'
import { SECTION_BG_LABELS } from '../../lib/invitationTypes'
import { DECOR_PRESETS, DECOR_SLOT_LABELS, type DecorPreset } from '../../lib/decorPresets'
import { api } from '../../lib/api'

const SECTION_BG_KEYS = Object.keys(SECTION_BG_LABELS) as SectionBgKey[]

type Props = {
  eventId: number
  settings: InvitationSettings
  onSettingsChange: (s: InvitationSettings) => void
  onSave: () => Promise<void>
  saving: boolean
}

const SLOT_OPTIONS: { value: DecorSlot; label: string }[] = (
  Object.entries(DECOR_SLOT_LABELS) as [DecorSlot, string][]
).map(([value, label]) => ({ value, label }))

export function DecorEditorPanel({
  eventId,
  settings,
  onSettingsChange,
  onSave,
  saving,
}: Props) {
  const bgInputRef = useRef<HTMLInputElement>(null)
  const sectionBgInputRef = useRef<HTMLInputElement>(null)
  const assetInputRef = useRef<HTMLInputElement>(null)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [uploadingSectionKey, setUploadingSectionKey] = useState<SectionBgKey | null>(null)
  const [pendingSectionKey, setPendingSectionKey] = useState<SectionBgKey | null>(null)
  const [uploadingAsset, setUploadingAsset] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assets = settings.decor_assets ?? []
  const sectionBgs = settings.section_backgrounds ?? {}

  async function uploadFile(file: File, endpoint: string): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post<{ data: { url: string } }>(endpoint, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data.url
  }

  async function handleBgUpload(file: File | undefined) {
    if (!file) return
    setUploadingBg(true)
    setError(null)
    try {
      const url = await uploadFile(file, `/api/events/${eventId}/decor`)
      onSettingsChange({ ...settings, background_image_url: url })
    } catch {
      setError('Gagal mengunggah background.')
    } finally {
      setUploadingBg(false)
    }
  }

  async function handleAssetUpload(file: File | undefined) {
    if (!file) return
    setUploadingAsset(true)
    setError(null)
    try {
      const url = await uploadFile(file, `/api/events/${eventId}/decor`)
      const newAsset: DecorAsset = {
        id: `custom-${crypto.randomUUID()}`,
        image_url: url,
        preset_id: 'custom',
        slot: 'tl',
        width_percent: 24,
        opacity: 0.85,
      }
      onSettingsChange({ ...settings, decor_assets: [...assets, newAsset] })
    } catch {
      setError('Gagal mengunggah asset.')
    } finally {
      setUploadingAsset(false)
    }
  }

  function addPreset(preset: DecorPreset) {
    const alreadyAdded = assets.some((a) => a.preset_id === preset.id)
    if (alreadyAdded) return
    const newAsset: DecorAsset = {
      id: `${preset.id}-${crypto.randomUUID()}`,
      image_url: preset.image_url,
      preset_id: preset.id,
      slot: preset.default_slot,
      width_percent: preset.default_width,
      opacity: preset.default_opacity,
    }
    onSettingsChange({ ...settings, decor_assets: [...assets, newAsset] })
  }

  function updateAsset(id: string, patch: Partial<DecorAsset>) {
    onSettingsChange({
      ...settings,
      decor_assets: assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })
  }

  function removeAsset(id: string) {
    onSettingsChange({
      ...settings,
      decor_assets: assets.filter((a) => a.id !== id),
    })
  }

  function removeBg() {
    onSettingsChange({ ...settings, background_image_url: '' })
  }

  async function handleSectionBgUpload(file: File | undefined, key: SectionBgKey) {
    if (!file) return
    setUploadingSectionKey(key)
    setError(null)
    try {
      const url = await uploadFile(file, `/api/events/${eventId}/decor`)
      onSettingsChange({
        ...settings,
        section_backgrounds: {
          ...sectionBgs,
          [key]: {
            ...sectionBgs[key],
            image_url: url,
            overlay: sectionBgs[key]?.overlay ?? 0.25,
          },
        },
      })
    } catch {
      setError(`Gagal mengunggah background ${SECTION_BG_LABELS[key]}.`)
    } finally {
      setUploadingSectionKey(null)
      setPendingSectionKey(null)
    }
  }

  function updateSectionBg(
    key: SectionBgKey,
    patch: {
      image_url?: string
      overlay?: number
      min_height_px?: number
      line_height?: number
    },
  ) {
    const next = { ...sectionBgs[key], ...patch }
    const hasImage = Boolean(next.image_url?.trim())
    const hasHeight = typeof next.min_height_px === 'number' && next.min_height_px > 0
    const hasLineHeight = typeof next.line_height === 'number' && next.line_height > 0
    if (!hasImage && !hasHeight && !hasLineHeight) {
      const rest = { ...sectionBgs }
      delete rest[key]
      onSettingsChange({ ...settings, section_backgrounds: rest })
      return
    }
    if (!hasImage) {
      delete next.image_url
    }
    if (!hasLineHeight) {
      delete next.line_height
    }
    onSettingsChange({
      ...settings,
      section_backgrounds: { ...sectionBgs, [key]: next },
    })
  }

  function removeSectionBg(key: SectionBgKey) {
    const current = sectionBgs[key]
    if (!current) return
    const hasHeight =
      typeof current.min_height_px === 'number' && current.min_height_px > 0
    const hasLineHeight =
      typeof current.line_height === 'number' && current.line_height > 0
    if (hasHeight || hasLineHeight) {
      updateSectionBg(key, { image_url: '' })
      return
    }
    const rest = { ...sectionBgs }
    delete rest[key]
    onSettingsChange({ ...settings, section_backgrounds: rest })
  }

  function pickSectionBg(key: SectionBgKey) {
    setPendingSectionKey(key)
    sectionBgInputRef.current?.click()
  }

  const hasBg = Boolean(settings.background_image_url?.trim())

  const viewportMode: ViewportMode = settings.viewport_mode ?? 'existing'

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Viewport ratio */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-stone-900">Rasio tampilan</h3>
        <p className="mt-1 text-xs text-stone-500">
          Mode Mobile memakai kanvas 720px lalu di-scale ke lebar HP, agar asset
          dan layout sama dengan preview. Existing = lebar penuh seperti sebelumnya.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(
            [
              { value: 'mobile', label: 'Mobile', hint: 'Rasio HP · asset konsisten' },
              { value: 'existing', label: 'Existing', hint: 'Lebar penuh desktop' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onSettingsChange({ ...settings, viewport_mode: opt.value })
              }
              className={[
                'rounded-xl border px-3 py-3 text-left transition',
                viewportMode === opt.value
                  ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-300'
                  : 'border-stone-200 bg-white hover:border-stone-300',
              ].join(' ')}
            >
              <span className="block text-sm font-semibold text-stone-900">{opt.label}</span>
              <span className="mt-0.5 block text-[11px] text-stone-500">{opt.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Background halaman penuh */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-stone-900">Background Halaman</h3>
        <p className="mt-1 text-xs text-stone-500">
          Opsional — menutup seluruh undangan di belakang semua section. Format: JPG/PNG/WEBP, maks 5MB.
        </p>

        <div className="mt-4 flex flex-wrap items-start gap-4">
          {hasBg ? (
            <div className="relative h-24 w-36 overflow-hidden rounded-xl border border-stone-200 shadow-inner">
              <img
                src={settings.background_image_url}
                alt="Background preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={removeBg}
                className="absolute right-1 top-1 rounded-full bg-white/80 px-1.5 py-0.5 text-xs font-medium text-red-600 shadow hover:bg-white"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              disabled={uploadingBg}
              className="flex h-24 w-36 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 text-xs text-stone-500 transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
            >
              {uploadingBg ? 'Mengunggah…' : (
                <>
                  <span className="text-2xl">🖼</span>
                  Upload background
                </>
              )}
            </button>
          )}
          <input
            ref={bgInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleBgUpload(e.target.files?.[0])}
          />

          {hasBg && (
            <div className="flex-1 min-w-[180px] space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-600">
                  Gelap overlay ({Math.round((settings.background_overlay ?? 0.25) * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.85"
                  step="0.05"
                  value={settings.background_overlay ?? 0.25}
                  className="mt-1 w-full accent-rose-600"
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      background_overlay: Number(e.target.value),
                    })
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                disabled={uploadingBg}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                Ganti gambar
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Background per section */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-stone-900">Background, tinggi & line spacing per Section</h3>
        <p className="mt-1 text-xs text-stone-500">
          Atur gambar latar, tinggi minimum, dan jarak baris (line spacing) tiap bagian undangan.
          Tinggi 0 = otomatis mengikuti konten. Line spacing Default = mengikuti tema.
        </p>
        <input
          ref={sectionBgInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (pendingSectionKey) void handleSectionBgUpload(file, pendingSectionKey)
          }}
        />
        <div className="mt-4 space-y-3">
          {SECTION_BG_KEYS.map((key) => {
            const bg = sectionBgs[key]
            const url = bg?.image_url?.trim()
            const heightPx = bg?.min_height_px ?? 0
            const lineHeight = bg?.line_height ?? 0
            const uploading = uploadingSectionKey === key
            return (
              <div
                key={key}
                className="flex flex-wrap items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/80 p-3"
              >
                {url ? (
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-stone-200">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSectionBg(key)}
                      className="absolute right-0.5 top-0.5 rounded-full bg-white/90 px-1 text-[10px] font-medium text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pickSectionBg(key)}
                    disabled={uploading}
                    className="flex h-16 w-24 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-[10px] text-stone-500 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
                  >
                    {uploading ? '…' : '+ Upload'}
                  </button>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium text-stone-800">
                    {SECTION_BG_LABELS[key]}
                  </p>

                  <div>
                    <label className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Tinggi section</span>
                      <span className="font-medium text-stone-700">
                        {heightPx > 0 ? `${heightPx}px` : 'Auto'}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1200"
                      step="20"
                      value={heightPx}
                      className="mt-1 w-full max-w-[260px] accent-rose-600"
                      onChange={(e) =>
                        updateSectionBg(key, {
                          min_height_px: Number(e.target.value),
                        })
                      }
                    />
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {[0, 320, 480, 640, 800].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateSectionBg(key, { min_height_px: v })}
                          className={[
                            'rounded-md border px-2 py-0.5 text-[10px] font-medium transition',
                            heightPx === v
                              ? 'border-rose-300 bg-rose-50 text-rose-800'
                              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300',
                          ].join(' ')}
                        >
                          {v === 0 ? 'Auto' : `${v}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Line spacing</span>
                      <span className="font-medium text-stone-700">
                        {lineHeight > 0 ? lineHeight.toFixed(1) : 'Default'}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2.4"
                      step="0.1"
                      value={lineHeight}
                      className="mt-1 w-full max-w-[260px] accent-rose-600"
                      onChange={(e) =>
                        updateSectionBg(key, {
                          line_height: Number(e.target.value),
                        })
                      }
                    />
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {[0, 1.2, 1.4, 1.6, 1.8, 2].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateSectionBg(key, { line_height: v })}
                          className={[
                            'rounded-md border px-2 py-0.5 text-[10px] font-medium transition',
                            Math.abs(lineHeight - v) < 0.05
                              ? 'border-rose-300 bg-rose-50 text-rose-800'
                              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300',
                          ].join(' ')}
                        >
                          {v === 0 ? 'Default' : v.toFixed(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {url ? (
                    <>
                      <div>
                        <label className="block text-[11px] text-stone-500">
                          Overlay ({Math.round((bg?.overlay ?? 0.25) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="0.85"
                          step="0.05"
                          value={bg?.overlay ?? 0.25}
                          className="mt-1 w-full max-w-[200px] accent-rose-600"
                          onChange={(e) =>
                            updateSectionBg(key, { overlay: Number(e.target.value) })
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => pickSectionBg(key)}
                        disabled={uploading}
                        className="text-[11px] font-medium text-rose-700 hover:underline disabled:opacity-50"
                      >
                        Ganti gambar
                      </button>
                    </>
                  ) : (
                    <p className="text-[11px] text-stone-400">Belum ada gambar latar</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Preset assets */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-stone-900">Asset Dekoratif Preset</h3>
        <p className="mt-1 text-xs text-stone-500">
          Klik untuk menambahkan ke undangan. Sesuaikan posisi & ukuran di bawah.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {DECOR_PRESETS.map((preset) => {
            const added = assets.some((a) => a.preset_id === preset.id)
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => addPreset(preset)}
                disabled={added}
                title={added ? 'Sudah ditambahkan' : `Tambah ${preset.label}`}
                className={[
                  'flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center text-xs transition',
                  added
                    ? 'border-rose-300 bg-rose-50 text-rose-700 opacity-70 cursor-not-allowed'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-rose-300 hover:bg-rose-50',
                ].join(' ')}
              >
                <img
                  src={preset.image_url}
                  alt={preset.label}
                  className="h-12 w-12 object-contain"
                />
                <span className="leading-tight">{preset.label}</span>
                {added && <span className="text-rose-600">✓</span>}
              </button>
            )
          })}
        </div>

        {/* Custom upload */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => assetInputRef.current?.click()}
            disabled={uploadingAsset}
            className="rounded-lg border border-dashed border-stone-300 px-4 py-2 text-xs font-medium text-stone-600 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
          >
            {uploadingAsset ? 'Mengunggah…' : '+ Upload asset custom (PNG/SVG transparan)'}
          </button>
          <input
            ref={assetInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => void handleAssetUpload(e.target.files?.[0])}
          />
        </div>
      </section>

      {/* Active assets list */}
      {assets.length > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-stone-900">Asset Aktif ({assets.length})</h3>
          <p className="mt-1 text-xs text-stone-500">
            Geser posisi bebas lewat tombol <span className="font-medium">Mode tampilan penuh</span>.
          </p>
          <div className="mt-4 space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex flex-wrap items-center gap-4 rounded-xl bg-stone-50 p-3"
              >
                <img
                  src={asset.image_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-contain border border-stone-200 bg-white p-1"
                />
                <div className="flex flex-1 flex-wrap gap-3 min-w-0">
                  <div>
                    <label className="text-xs font-medium text-stone-500">
                      Posisi
                      {typeof asset.x_percent === 'number' && (
                        <span className="ml-1 text-amber-700">(bebas)</span>
                      )}
                    </label>
                    <select
                      className="mt-0.5 block rounded-lg border border-stone-200 px-2 py-1 text-xs"
                      value={asset.slot}
                      onChange={(e) =>
                        updateAsset(asset.id, {
                          slot: e.target.value as DecorSlot,
                          x_percent: undefined,
                          y_percent: undefined,
                        })
                      }
                    >
                      {SLOT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500">
                      Lebar ({asset.width_percent}%)
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="60"
                      step="1"
                      value={asset.width_percent}
                      className="mt-1 block w-28 accent-rose-600"
                      onChange={(e) => updateAsset(asset.id, { width_percent: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500">
                      Opacity ({Math.round(asset.opacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={asset.opacity}
                      className="mt-1 block w-28 accent-rose-600"
                      onChange={(e) => updateAsset(asset.id, { opacity: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {typeof asset.x_percent === 'number' && (
                    <button
                      type="button"
                      onClick={() =>
                        updateAsset(asset.id, {
                          x_percent: undefined,
                          y_percent: undefined,
                        })
                      }
                      className="rounded-lg px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50"
                    >
                      Reset slot
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAsset(asset.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="rounded-xl bg-rose-700 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-rose-800 disabled:opacity-60"
        >
          {saving ? 'Menyimpan…' : 'Simpan Desain'}
        </button>
      </div>
    </div>
  )
}

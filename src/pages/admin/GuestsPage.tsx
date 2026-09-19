import axios from 'axios'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ensureCsrfCookie } from '../../lib/api'

type GuestRelationOption = {
  id: number
  label: string
  sort_order: number
}

type GuestRow = {
  id: number
  name: string
  phone_number: string | null
  guest_type: string
  guest_relation_id?: number | null
  relation?: { id: number; label: string } | null
  secret_token: string
  qr_code_url: string | null
  invitation_url: string | null
  is_attended: boolean
  scanned_at: string | null
}

type DeviceOption = {
  id: number
  name: string
  phone_label: string | null
  is_active: boolean
}

type EventDetail = {
  id: number
  name: string
  whatsapp_device_id?: number | null
}

const DEFAULT_MESSAGE =
  'Halo {nama},\n\nAnda diundang. Silakan buka undangan melalui tautan berikut:\n\n{link}'

export function GuestsPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = Number(id)

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [guests, setGuests] = useState<GuestRow[]>([])
  const [relations, setRelations] = useState<GuestRelationOption[]>([])
  const [devices, setDevices] = useState<DeviceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [gName, setGName] = useState('')
  const [gPhone, setGPhone] = useState('')
  const [gType, setGType] = useState<'VIP' | 'Regular'>('Regular')
  const [gRelationId, setGRelationId] = useState<string>('')
  const [editing, setEditing] = useState<GuestRow | null>(null)

  const [newRelationLabel, setNewRelationLabel] = useState('')
  const [editingRelationId, setEditingRelationId] = useState<number | null>(null)
  const [editingRelationLabel, setEditingRelationLabel] = useState('')

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [sendOpen, setSendOpen] = useState(false)
  const [sendTargets, setSendTargets] = useState<GuestRow[]>([])
  const [sendMessage, setSendMessage] = useState(DEFAULT_MESSAGE)
  const [sendDeviceId, setSendDeviceId] = useState('')
  const [sending, setSending] = useState(false)

  const invitationBase = useMemo(
    () => `${window.location.origin}/invitation`,
    [],
  )

  const load = useCallback(async () => {
    if (!Number.isFinite(eventId)) return
    setError(null)
    try {
      const [evRes, gRes, dRes, rRes] = await Promise.all([
        api.get<{ data: EventDetail }>(`/api/events/${eventId}`),
        api.get<{ data: GuestRow[] }>(`/api/events/${eventId}/guests`),
        api.get<{ data: DeviceOption[] }>('/api/whatsapp-devices'),
        api.get<{ data: GuestRelationOption[] }>(
          `/api/events/${eventId}/guest-relations`,
        ),
      ])
      setEvent(evRes.data.data)
      setGuests(gRes.data.data)
      setDevices(dRes.data.data)
      setRelations(rRes.data.data)
      const defaultDevice = evRes.data.data.whatsapp_device_id
      if (defaultDevice != null) {
        setSendDeviceId(String(defaultDevice))
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setError('Sesi berakhir.')
      } else {
        setError('Gagal memuat tamu.')
      }
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  function resetGuestForm() {
    setEditing(null)
    setGName('')
    setGPhone('')
    setGType('Regular')
    setGRelationId('')
  }

  function startEdit(g: GuestRow) {
    setEditing(g)
    setGName(g.name)
    setGPhone(g.phone_number ?? '')
    setGType(g.guest_type === 'VIP' ? 'VIP' : 'Regular')
    setGRelationId(
      g.guest_relation_id != null
        ? String(g.guest_relation_id)
        : g.relation?.id != null
          ? String(g.relation.id)
          : '',
    )
  }

  async function onGuestSubmit(e: FormEvent) {
    e.preventDefault()
    if (!Number.isFinite(eventId)) return
    setError(null)
    const payload = {
      name: gName,
      phone_number: gPhone || null,
      guest_type: gType,
      guest_relation_id: gRelationId ? Number(gRelationId) : null,
    }
    try {
      if (editing) {
        await api.put(`/api/events/${eventId}/guests/${editing.id}`, payload)
      } else {
        await api.post(`/api/events/${eventId}/guests`, payload)
      }
      resetGuestForm()
      await load()
      setToast('Tamu disimpan.')
      window.setTimeout(() => setToast(null), 2500)
    } catch {
      setError('Gagal menyimpan tamu.')
    }
  }

  async function removeGuest(g: GuestRow) {
    if (!window.confirm(`Hapus tamu "${g.name}"?`)) return
    setError(null)
    try {
      await api.delete(`/api/events/${eventId}/guests/${g.id}`)
      await load()
      if (editing?.id === g.id) resetGuestForm()
      setSelectedIds((ids) => ids.filter((x) => x !== g.id))
    } catch {
      setError('Gagal menghapus tamu.')
    }
  }

  async function importGuests(file: File | null) {
    if (!file || !Number.isFinite(eventId)) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await api.post(`/api/events/${eventId}/guests/import`, fd)
      await load()
      setToast('Import selesai.')
      window.setTimeout(() => setToast(null), 2500)
    } catch {
      setError('Import gagal. Pastikan kolom: name, phone_number, guest_type, relation.')
    }
  }

  async function addRelation(e: FormEvent) {
    e.preventDefault()
    const label = newRelationLabel.trim()
    if (!label || !Number.isFinite(eventId)) return
    setError(null)
    try {
      await api.post(`/api/events/${eventId}/guest-relations`, { label })
      setNewRelationLabel('')
      await load()
      setToast('Relasi ditambahkan.')
      window.setTimeout(() => setToast(null), 2000)
    } catch {
      setError('Gagal menambah relasi (cek apakah label sudah ada).')
    }
  }

  async function saveRelationEdit(id: number) {
    const label = editingRelationLabel.trim()
    if (!label) return
    setError(null)
    try {
      await api.put(`/api/events/${eventId}/guest-relations/${id}`, { label })
      setEditingRelationId(null)
      setEditingRelationLabel('')
      await load()
      setToast('Relasi diperbarui.')
      window.setTimeout(() => setToast(null), 2000)
    } catch {
      setError('Gagal mengubah relasi.')
    }
  }

  async function removeRelation(r: GuestRelationOption) {
    if (!window.confirm(`Hapus relasi "${r.label}"? Tamu yang memakai akan dikosongkan.`)) {
      return
    }
    setError(null)
    try {
      await api.delete(`/api/events/${eventId}/guest-relations/${r.id}`)
      if (gRelationId === String(r.id)) setGRelationId('')
      await load()
    } catch {
      setError('Gagal menghapus relasi.')
    }
  }

  async function moveRelation(r: GuestRelationOption, direction: -1 | 1) {
    const ordered = [...relations].sort(
      (a, b) => a.sort_order - b.sort_order || a.id - b.id,
    )
    const idx = ordered.findIndex((x) => x.id === r.id)
    const swapWith = ordered[idx + direction]
    if (!swapWith) return
    setError(null)
    try {
      await Promise.all([
        api.put(`/api/events/${eventId}/guest-relations/${r.id}`, {
          sort_order: swapWith.sort_order,
        }),
        api.put(`/api/events/${eventId}/guest-relations/${swapWith.id}`, {
          sort_order: r.sort_order,
        }),
      ])
      await load()
    } catch {
      setError('Gagal mengubah urutan relasi.')
    }
  }

  async function downloadImportTemplate() {
    if (!Number.isFinite(eventId)) return
    setError(null)
    try {
      const { data } = await api.get<Blob>(
        `/api/events/${eventId}/guests/import/template`,
        {
          params: { format: 'xlsx' },
          responseType: 'blob',
          headers: { Accept: '*/*' },
        },
      )
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'guest-import-template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      setToast('Template XLSX diunduh.')
      window.setTimeout(() => setToast(null), 2500)
    } catch {
      setError('Gagal mengunduh template import.')
    }
  }

  async function regenerateQr(g: GuestRow) {
    setError(null)
    try {
      await api.post(
        `/api/events/${eventId}/guests/${g.id}/qr/regenerate`,
        {},
      )
      await load()
      setToast('QR dibuat ulang.')
      window.setTimeout(() => setToast(null), 2500)
    } catch {
      setError('Gagal membuat ulang QR.')
    }
  }

  function copyInvitationLink(g: GuestRow) {
    const url =
      g.invitation_url ?? `${invitationBase}/${g.secret_token}`
    void navigator.clipboard.writeText(url)
    setToast('Link undangan disalin.')
    window.setTimeout(() => setToast(null), 2000)
  }

  function openSend(targets: GuestRow[]) {
    if (targets.length === 0) {
      setError('Pilih minimal satu tamu.')
      return
    }
    setSendTargets(targets)
    setSendMessage(DEFAULT_MESSAGE)
    setSendDeviceId(
      event?.whatsapp_device_id != null ? String(event.whatsapp_device_id) : '',
    )
    setSendOpen(true)
    setError(null)
  }

  async function submitSend(e: FormEvent) {
    e.preventDefault()
    if (!Number.isFinite(eventId) || sendTargets.length === 0) return
    setSending(true)
    setError(null)
    try {
      await ensureCsrfCookie()
      const payload: {
        message: string
        device_id?: number
        guest_ids?: number[]
      } = {
        message: sendMessage,
      }
      if (sendDeviceId) {
        payload.device_id = Number(sendDeviceId)
      }

      if (sendTargets.length === 1) {
        const res = await api.post<{
          data: { status: string; error_message?: string | null }
        }>(
          `/api/events/${eventId}/guests/${sendTargets[0].id}/send-invitation`,
          payload,
          { validateStatus: (s) => s === 200 || s === 422 },
        )
        if (res.data.data.status === 'sent') {
          setToast(`WA terkirim ke ${sendTargets[0].name}.`)
        } else {
          setError(res.data.data.error_message ?? 'Pengiriman gagal.')
          setSending(false)
          return
        }
      } else {
        payload.guest_ids = sendTargets.map((g) => g.id)
        const res = await api.post<{
          data: { sent_count: number; failed_count: number }
        }>(`/api/events/${eventId}/guests/send-invitations`, payload)
        setToast(
          `Bulk selesai: ${res.data.data.sent_count} sukses, ${res.data.data.failed_count} gagal.`,
        )
      }

      setSendOpen(false)
      setSelectedIds([])
      window.setTimeout(() => setToast(null), 3500)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.data?.error_message ??
          err.response?.data?.message ??
          'Gagal mengirim WhatsApp.'
        setError(String(msg))
      } else {
        setError('Gagal mengirim WhatsApp.')
      }
    } finally {
      setSending(false)
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    )
  }

  function toggleSelectAll() {
    if (selectedIds.length === guests.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(guests.map((g) => g.id))
    }
  }

  const activeDevices = devices.filter(
    (d) =>
      d.is_active ||
      (sendDeviceId !== '' && Number(sendDeviceId) === d.id),
  )

  if (!Number.isFinite(eventId)) {
    return <div className="text-red-600">ID acara tidak valid.</div>
  }

  if (loading) {
    return <div className="text-stone-600">Memuat tamu…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/admin/events"
            className="text-sm font-medium text-rose-700 hover:text-rose-800"
          >
            ← Kembali ke acara
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-black">
            Tamu — {event?.name ?? `#${eventId}`}
          </h1>
          <p className="text-sm text-stone-600">
            Tambah tamu, import dari template Excel, salin link, atau kirim via
            WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
            disabled={selectedIds.length === 0}
            onClick={() =>
              openSend(guests.filter((g) => selectedIds.includes(g.id)))
            }
          >
            Kirim WA terpilih ({selectedIds.length})
          </button>
          <Link
            to={`/admin/events/${eventId}/invitation`}
            className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-900 hover:bg-pink-100"
          >
            Kelola undangan
          </Link>
          <button
            type="button"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
            onClick={() => void downloadImportTemplate()}
          >
            Download template
          </button>
          <label className="cursor-pointer rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50">
            Import CSV/XLSX
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => void importGuests(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {sendOpen ? (
        <form
          onSubmit={submitSend}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-black">
            Kirim WhatsApp ({sendTargets.length} tamu)
          </h2>
          <p className="mt-1 text-xs text-stone-600">
            Placeholder: {'{nama}'}, {'{link}'}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-stone-600">
                Pesan
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
                rows={4}
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600">
                Device pengirim
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
                value={sendDeviceId}
                onChange={(e) => setSendDeviceId(e.target.value)}
              >
                <option value="">— Pakai default acara —</option>
                {activeDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.phone_label ? ` (${d.phone_label})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {sending ? 'Mengirim…' : 'Kirim sekarang'}
            </button>
            <button
              type="button"
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
              onClick={() => setSendOpen(false)}
              disabled={sending}
            >
              Batal
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-black">Kelola Relasi</h2>
        <p className="mt-1 text-xs text-stone-500">
          Opsi select untuk label relasi tamu (keluarga, teman, dll).
        </p>
        <form onSubmit={addRelation} className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none ring-rose-200 focus:ring-2"
            value={newRelationLabel}
            onChange={(e) => setNewRelationLabel(e.target.value)}
            placeholder="Contoh: Keluarga Mempelai Pria"
          />
          <button
            type="submit"
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Tambah
          </button>
        </form>
        <ul className="mt-4 divide-y divide-stone-100">
          {relations.length === 0 ? (
            <li className="py-3 text-sm text-stone-500">Belum ada opsi relasi.</li>
          ) : (
            relations.map((r, index) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 py-2 text-sm"
              >
                {editingRelationId === r.id ? (
                  <>
                    <input
                      className="min-w-[180px] flex-1 rounded-lg border border-stone-200 px-2 py-1 text-stone-900"
                      value={editingRelationLabel}
                      onChange={(e) => setEditingRelationLabel(e.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white"
                      onClick={() => void saveRelationEdit(r.id)}
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 px-2 py-1 text-xs"
                      onClick={() => {
                        setEditingRelationId(null)
                        setEditingRelationLabel('')
                      }}
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-stone-800">{r.label}</span>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 px-2 py-1 text-xs disabled:opacity-40"
                      disabled={index === 0}
                      onClick={() => void moveRelation(r, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 px-2 py-1 text-xs disabled:opacity-40"
                      disabled={index === relations.length - 1}
                      onClick={() => void moveRelation(r, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 px-2 py-1 text-xs"
                      onClick={() => {
                        setEditingRelationId(r.id)
                        setEditingRelationLabel(r.label)
                      }}
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                      onClick={() => void removeRelation(r)}
                    >
                      Hapus
                    </button>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      <form
        onSubmit={onGuestSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-black">
          {editing ? 'Ubah tamu' : 'Tamu baru'}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="text-xs font-medium text-stone-600">Nama</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={gName}
              onChange={(e) => setGName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">Telepon</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={gPhone}
              onChange={(e) => setGPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">Tipe</label>
            <select
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={gType}
              onChange={(e) => setGType(e.target.value as 'VIP' | 'Regular')}
            >
              <option value="Regular">Regular</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">Relasi</label>
            <select
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={gRelationId}
              onChange={(e) => setGRelationId(e.target.value)}
            >
              <option value="">— Tidak diisi —</option>
              {relations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            {editing ? 'Simpan perubahan' : 'Tambah tamu'}
          </button>
          {editing && (
            <button
              type="button"
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
              onClick={resetGuestForm}
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    guests.length > 0 && selectedIds.length === guests.length
                  }
                  onChange={toggleSelectAll}
                  aria-label="Pilih semua"
                />
              </th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Telepon</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Relasi</th>
              <th className="px-4 py-3">Kehadiran</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {guests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                  Belum ada tamu.
                </td>
              </tr>
            )}
            {guests.map((g) => (
              <tr key={g.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(g.id)}
                    onChange={() => toggleSelect(g.id)}
                    aria-label={`Pilih ${g.name}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-stone-900">{g.name}</td>
                <td className="px-4 py-3 text-stone-600">{g.phone_number ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      g.guest_type === 'VIP'
                        ? 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900'
                        : 'rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700'
                    }
                  >
                    {g.guest_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {g.relation?.label ?? '—'}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {g.is_attended ? (
                    <span className="text-emerald-700">
                      Hadir
                      {g.scanned_at
                        ? ` · ${new Date(g.scanned_at).toLocaleString()}`
                        : ''}
                    </span>
                  ) : (
                    'Belum'
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                      onClick={() => openSend([g])}
                    >
                      Kirim WA
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-stone-900 px-3 py-1 text-xs font-semibold text-white hover:bg-stone-800"
                      onClick={() => copyInvitationLink(g)}
                    >
                      Salin link
                    </button>
                    {g.qr_code_url && (
                      <a
                        href={g.qr_code_url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                      >
                        QR
                      </a>
                    )}
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 px-3 py-1 text-xs text-stone-700 hover:bg-stone-50"
                      onClick={() => void regenerateQr(g)}
                    >
                      QR ulang
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 px-3 py-1 text-xs text-stone-700 hover:bg-stone-50"
                      onClick={() => startEdit(g)}
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => void removeGuest(g)}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import axios from 'axios'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ensureCsrfCookie, uploadForm } from '../../lib/api'
import {
  DataTableFooter,
  DataTableToolbar,
  SortableTh,
  useAdminDataTable,
} from '../../components/AdminDataTable'

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

type WaSendSummary = {
  guests_total: number
  never_sent: number
  latest_sent: number
  latest_failed: number
  latest_pending: number
  attempts_sent: number
  attempts_failed: number
  attempts_pending: number
}

type WaSendRow = {
  id: number
  guest_id: number
  phone_number: string | null
  status: 'pending' | 'sent' | 'failed'
  error_message: string | null
  sent_at: string | null
  created_at: string
  guest: { id: number; name: string; phone_number: string | null } | null
  device: { id: number; name: string; phone_label: string | null } | null
}

const DEFAULT_MESSAGE =
  'Halo {nama},\n\nAnda diundang. Silakan buka undangan melalui tautan berikut:\n\n{link}'

type PageTab = 'guests' | 'wa-history'

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

  const [activeTab, setActiveTab] = useState<PageTab>('guests')
  const [waSummary, setWaSummary] = useState<WaSendSummary | null>(null)
  const [waSends, setWaSends] = useState<WaSendRow[]>([])
  const [waStatusFilter, setWaStatusFilter] = useState<string>('')
  const [waLoading, setWaLoading] = useState(false)
  const [waPage, setWaPage] = useState(1)
  const [waMeta, setWaMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  })

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

  const loadWaHistory = useCallback(async () => {
    if (!Number.isFinite(eventId)) return
    setWaLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        per_page: '25',
        page: String(waPage),
      })
      if (waStatusFilter) {
        params.set('status', waStatusFilter)
      }
      const [sumRes, listRes] = await Promise.all([
        api.get<{ data: WaSendSummary }>(
          `/api/events/${eventId}/invitation-sends/summary`,
        ),
        api.get<{
          data: WaSendRow[]
          meta: { current_page: number; last_page: number; total: number }
        }>(`/api/events/${eventId}/invitation-sends?${params.toString()}`),
      ])
      setWaSummary(sumRes.data.data)
      setWaSends(listRes.data.data)
      setWaMeta(listRes.data.meta)
    } catch {
      setError('Gagal memuat riwayat WhatsApp.')
    } finally {
      setWaLoading(false)
    }
  }, [eventId, waPage, waStatusFilter])

  useEffect(() => {
    if (activeTab === 'wa-history') {
      void loadWaHistory()
    }
  }, [activeTab, loadWaHistory])

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

  async function removeSelected() {
    if (selectedIds.length === 0 || !Number.isFinite(eventId)) return
    if (!window.confirm(`Hapus ${selectedIds.length} tamu terpilih? Data disembunyikan (soft delete), bukan dihapus permanen.`)) {
      return
    }
    const ids = selectedIds
    setError(null)
    try {
      await ensureCsrfCookie()
      const { data } = await api.post<{ deleted: number }>(
        `/api/events/${eventId}/guests/bulk-delete`,
        { ids },
      )
      setSelectedIds([])
      if (editing && ids.includes(editing.id)) resetGuestForm()
      await load()
      setToast(`${data.deleted} tamu dihapus.`)
      window.setTimeout(() => setToast(null), 2500)
    } catch {
      setError('Gagal menghapus tamu terpilih.')
    }
  }

  async function removeGuest(g: GuestRow) {
    if (!window.confirm(`Hapus tamu "${g.name}"? Data disembunyikan (soft delete), bukan dihapus permanen.`)) return
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
    fd.append('file', file, file.name)
    try {
      // fetch() sets multipart boundary. Axios JSON/base64 hits old API as "file required".
      const data = await uploadForm<{
        message: string
        created: number
        skipped_empty_rows: number
        warnings?: string[]
      }>(`/api/events/${eventId}/guests/import`, fd)
      await load()
      const warnings = data.warnings ?? []
      if (warnings.length > 0) {
        setToast(
          `Import ${data.created} tamu. ${warnings.length} peringatan (relasi tidak cocok dikosongkan).`,
        )
        setError(warnings.slice(0, 5).join(' '))
      } else {
        setToast(`Import selesai: ${data.created} tamu.`)
      }
      window.setTimeout(() => setToast(null), 3500)
    } catch (e) {
      const err = e as Error & {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } }
      }
      const fieldError = err.response?.data?.errors?.file?.[0]
      setError(
        `Import gagal: ${fieldError ?? err.response?.data?.message ?? err.message ?? 'unknown'}`,
      )
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
      if (data.type?.includes('application/json')) {
        const text = await data.text()
        const parsed = JSON.parse(text) as { message?: string }
        throw new Error(parsed.message || 'Gagal mengunduh template')
      }
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'guest-import-template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      setToast('Template XLSX diunduh.')
      window.setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Gagal mengunduh template import.',
      )
    }
  }

  async function downloadExport() {
    if (!Number.isFinite(eventId)) return
    setError(null)
    try {
      const res = await api.get<Blob>(
        `/api/events/${eventId}/guests/export`,
        {
          responseType: 'blob',
          headers: { Accept: '*/*' },
        },
      )
      const data = res.data
      if (data.type?.includes('application/json')) {
        const text = await data.text()
        const parsed = JSON.parse(text) as { message?: string }
        throw new Error(parsed.message || 'Gagal mengekspor tamu')
      }
      const disposition = String(res.headers['content-disposition'] ?? '')
      const match = /filename="?([^";]+)"?/i.exec(disposition)
      const filename = match?.[1] ?? 'guests-export.xlsx'
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setToast('Export XLSX diunduh.')
      window.setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Gagal mengekspor data tamu.',
      )
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
          void loadWaHistory()
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
      void loadWaHistory()
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

  function checkAll() {
    setSelectedIds(table.filtered.map((g) => g.id))
  }

  function toggleSelectAll() {
    const visibleIds = table.filtered.map((g) => g.id)
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
    setSelectedIds(allSelected ? [] : visibleIds)
  }

  const table = useAdminDataTable(guests, {
    initialSortKey: 'name',
    searchText: (g) =>
      [
        g.name,
        g.phone_number ?? '',
        g.guest_type,
        g.relation?.label ?? '',
        g.is_attended ? 'hadir' : 'belum',
      ].join(' '),
    sortValue: (g, key) => {
      if (key === 'name') return g.name
      if (key === 'phone') return g.phone_number ?? ''
      if (key === 'type') return g.guest_type
      if (key === 'relation') return g.relation?.label ?? ''
      if (key === 'attended') return g.is_attended ? 1 : 0
      return ''
    },
  })

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
          <p className="mt-1 text-xs text-stone-500">
            Template import: <code className="text-stone-700">name</code>,{' '}
            <code className="text-stone-700">phone_number</code>,{' '}
            <code className="text-stone-700">guest_type</code>,{' '}
            <code className="text-stone-700">relation</code>. Nilai{' '}
            <code className="text-stone-700">relation</code> harus sama persis
            dengan label di master Relasi di bawah.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-50"
            disabled={table.filtered.length === 0}
            onClick={checkAll}
          >
            Check all ({table.filtered.length})
          </button>
          <button
            type="button"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-50"
            disabled={table.filtered.length === 0}
            onClick={toggleSelectAll}
          >
            {table.filtered.length > 0 &&
            table.filtered.every((g) => selectedIds.includes(g.id))
              ? 'Uncheck all'
              : 'Check all'}
          </button>
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
          <button
            type="button"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
            disabled={selectedIds.length === 0}
            onClick={() => void removeSelected()}
          >
            Hapus terpilih ({selectedIds.length})
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
          <button
            type="button"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
            onClick={() => void downloadExport()}
          >
            Export XLSX
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

      <div className="flex gap-1 rounded-xl border border-stone-200 bg-white p-1 shadow-sm w-fit">
        <button
          type="button"
          className={[
            'rounded-lg px-4 py-2 text-sm font-medium transition',
            activeTab === 'guests'
              ? 'bg-rose-100 text-rose-900'
              : 'text-stone-600 hover:bg-stone-50',
          ].join(' ')}
          onClick={() => setActiveTab('guests')}
        >
          Tamu
        </button>
        <button
          type="button"
          className={[
            'rounded-lg px-4 py-2 text-sm font-medium transition',
            activeTab === 'wa-history'
              ? 'bg-emerald-100 text-emerald-900'
              : 'text-stone-600 hover:bg-stone-50',
          ].join(' ')}
          onClick={() => setActiveTab('wa-history')}
        >
          Riwayat WA
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === 'wa-history' ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Belum dikirim
              </div>
              <div className="mt-1 text-2xl font-semibold text-stone-900">
                {waSummary?.never_sent ?? '—'}
              </div>
              <p className="mt-1 text-xs text-stone-500">
                dari {waSummary?.guests_total ?? '—'} tamu
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                Terkirim
              </div>
              <div className="mt-1 text-2xl font-semibold text-emerald-900">
                {waSummary?.latest_sent ?? '—'}
              </div>
              <p className="mt-1 text-xs text-emerald-800/70">
                status terakhir sukses
              </p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-red-800">
                Gagal
              </div>
              <div className="mt-1 text-2xl font-semibold text-red-900">
                {waSummary?.latest_failed ?? '—'}
              </div>
              <p className="mt-1 text-xs text-red-800/70">
                status terakhir gagal
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-amber-900">
                Total percobaan
              </div>
              <div className="mt-1 text-2xl font-semibold text-amber-950">
                {(waSummary?.attempts_sent ?? 0) +
                  (waSummary?.attempts_failed ?? 0) +
                  (waSummary?.attempts_pending ?? 0)}
              </div>
              <p className="mt-1 text-xs text-amber-900/70">
                {waSummary?.attempts_sent ?? 0} sukses ·{' '}
                {waSummary?.attempts_failed ?? 0} gagal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-stone-600">
              Filter status{' '}
              <select
                className="ml-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900"
                value={waStatusFilter}
                onChange={(e) => {
                  setWaPage(1)
                  setWaStatusFilter(e.target.value)
                }}
              >
                <option value="">Semua</option>
                <option value="sent">Terkirim</option>
                <option value="failed">Gagal</option>
                <option value="pending">Pending</option>
              </select>
            </label>
            <button
              type="button"
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              onClick={() => void loadWaHistory()}
              disabled={waLoading}
            >
              {waLoading ? 'Memuat…' : 'Muat ulang'}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Tamu</th>
                  <th className="px-4 py-3">Nomor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {waLoading && waSends.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-stone-500"
                    >
                      Memuat riwayat…
                    </td>
                  </tr>
                ) : null}
                {!waLoading && waSends.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-stone-500"
                    >
                      Belum ada percobaan pengiriman WhatsApp.
                    </td>
                  </tr>
                ) : null}
                {waSends.map((row) => (
                  <tr key={row.id} className="hover:bg-stone-50/80">
                    <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                      {new Date(row.sent_at ?? row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {row.guest?.name ?? `#${row.guest_id}`}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {row.phone_number ?? row.guest?.phone_number ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'sent' ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                          Terkirim
                        </span>
                      ) : row.status === 'failed' ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-900">
                          Gagal
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {row.device?.name ?? '—'}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-stone-500">
                      {row.error_message ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {waMeta.last_page > 1 ? (
              <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 text-sm text-stone-600">
                <span>
                  Halaman {waMeta.current_page} / {waMeta.last_page} ·{' '}
                  {waMeta.total} data
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-stone-200 px-3 py-1 disabled:opacity-40"
                    disabled={waPage <= 1}
                    onClick={() => setWaPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-stone-200 px-3 py-1 disabled:opacity-40"
                    disabled={waPage >= waMeta.last_page}
                    onClick={() => setWaPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <>
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

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <DataTableToolbar
          query={table.query}
          onQueryChange={table.setQuery}
          pageSize={table.pageSize}
          onPageSizeChange={table.setPageSize}
          placeholder="Nama, telepon, tipe, relasi"
        />
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    table.filtered.length > 0 &&
                    table.filtered.every((g) => selectedIds.includes(g.id))
                  }
                  onChange={toggleSelectAll}
                  aria-label="Pilih semua hasil"
                />
              </th>
              <SortableTh
                label="Nama"
                active={table.sortKey === 'name'}
                dir={table.sortDir}
                onClick={() => table.toggleSort('name')}
              />
              <SortableTh
                label="Telepon"
                active={table.sortKey === 'phone'}
                dir={table.sortDir}
                onClick={() => table.toggleSort('phone')}
              />
              <SortableTh
                label="Tipe"
                active={table.sortKey === 'type'}
                dir={table.sortDir}
                onClick={() => table.toggleSort('type')}
              />
              <SortableTh
                label="Relasi"
                active={table.sortKey === 'relation'}
                dir={table.sortDir}
                onClick={() => table.toggleSort('relation')}
              />
              <SortableTh
                label="Kehadiran"
                active={table.sortKey === 'attended'}
                dir={table.sortDir}
                onClick={() => table.toggleSort('attended')}
              />
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {table.pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                  {guests.length === 0 ? 'Belum ada tamu.' : 'Tidak ada tamu yang cocok.'}
                </td>
              </tr>
            )}
            {table.pageRows.map((g) => (
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
        <DataTableFooter
          from={table.from}
          to={table.to}
          filteredCount={table.filteredCount}
          totalCount={table.totalCount}
          page={table.page}
          pageCount={table.pageCount}
          onPageChange={table.setPage}
        />
      </div>
        </>
      )}
    </div>
  )
}

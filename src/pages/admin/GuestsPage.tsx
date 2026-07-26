import axios from 'axios'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'

type GuestRow = {
  id: number
  name: string
  phone_number: string | null
  guest_type: string
  secret_token: string
  qr_code_url: string | null
  invitation_url: string | null
  is_attended: boolean
  scanned_at: string | null
}

type EventDetail = {
  id: number
  name: string
}

export function GuestsPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = Number(id)

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [guests, setGuests] = useState<GuestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [gName, setGName] = useState('')
  const [gPhone, setGPhone] = useState('')
  const [gType, setGType] = useState<'VIP' | 'Regular'>('Regular')
  const [editing, setEditing] = useState<GuestRow | null>(null)

  const invitationBase = useMemo(
    () => `${window.location.origin}/invitation`,
    [],
  )

  const load = useCallback(async () => {
    if (!Number.isFinite(eventId)) return
    setError(null)
    try {
      const [evRes, gRes] = await Promise.all([
        api.get<{ data: EventDetail }>(`/api/events/${eventId}`),
        api.get<{ data: GuestRow[] }>(`/api/events/${eventId}/guests`),
      ])
      setEvent(evRes.data.data)
      setGuests(gRes.data.data)
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
  }

  function startEdit(g: GuestRow) {
    setEditing(g)
    setGName(g.name)
    setGPhone(g.phone_number ?? '')
    setGType(g.guest_type === 'VIP' ? 'VIP' : 'Regular')
  }

  async function onGuestSubmit(e: FormEvent) {
    e.preventDefault()
    if (!Number.isFinite(eventId)) return
    setError(null)
    const payload = {
      name: gName,
      phone_number: gPhone || null,
      guest_type: gType,
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
    } catch {
      setError('Gagal menghapus tamu.')
    }
  }

  async function importCsv(file: File | null) {
    if (!file || !Number.isFinite(eventId)) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await api.post(`/api/events/${eventId}/guests/import`, fd)
      await load()
      setToast('Import CSV selesai.')
      window.setTimeout(() => setToast(null), 2500)
    } catch {
      setError('Import gagal. Pastikan kolom: name,phone_number,guest_type.')
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
            Tambah tamu, salin link undangan, atau unduh QR untuk dicetak.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/admin/events/${eventId}/invitation`}
            className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-900 hover:bg-pink-100"
          >
            Kelola undangan
          </Link>
          <label className="cursor-pointer rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50">
          Import CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void importCsv(e.target.files?.[0] ?? null)}
          />
        </label>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <form
        onSubmit={onGuestSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-black">
          {editing ? 'Ubah tamu' : 'Tamu baru'}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
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
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Telepon</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Kehadiran</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {guests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  Belum ada tamu.
                </td>
              </tr>
            )}
            {guests.map((g) => (
              <tr key={g.id} className="hover:bg-stone-50/80">
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

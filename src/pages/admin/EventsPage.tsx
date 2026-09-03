import axios from 'axios'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

type EventRow = {
  id: number
  name: string
  slug: string
  event_date: string | null
  location: string | null
  guests_count?: number
}

export function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [editing, setEditing] = useState<EventRow | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const { data } = await api.get<{ data: EventRow[] }>(
        '/api/events?with_guest_counts=1',
      )
      setEvents(data.data)
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setError('Sesi berakhir. Silakan masuk lagi.')
      } else {
        setError('Gagal memuat acara.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function startEdit(ev: EventRow) {
    setEditing(ev)
    setName(ev.name)
    setEventDate(ev.event_date ? ev.event_date.slice(0, 16) : '')
    setLocation(ev.location ?? '')
  }

  function resetForm() {
    setEditing(null)
    setName('')
    setEventDate('')
    setLocation('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: Record<string, string | null> = {
      name,
      location: location || null,
      event_date: eventDate ? new Date(eventDate).toISOString() : null,
    }

    try {
      if (editing) {
        await api.put(`/api/events/${editing.id}`, payload)
      } else {
        await api.post('/api/events', payload)
      }
      resetForm()
      await load()
    } catch {
      setError('Gagal menyimpan acara.')
    }
  }

  async function remove(ev: EventRow) {
    if (!window.confirm(`Hapus acara "${ev.name}"?`)) return
    setError(null)
    try {
      await api.delete(`/api/events/${ev.id}`)
      await load()
      if (editing?.id === ev.id) resetForm()
    } catch {
      setError('Gagal menghapus acara.')
    }
  }

  if (loading) {
    return <div className="text-stone-600">Memuat acara…</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-black">
          Acara
        </h1>
        <p className="text-sm text-stone-600">
          Buat dan kelola acara pernikahan atau event lainnya.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-black">
          {editing ? 'Ubah acara' : 'Acara baru'}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-stone-600">Nama</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pernikahan Nanda & Ayu"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">
              Tanggal & waktu
            </label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">Lokasi</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Jakarta"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            {editing ? 'Simpan perubahan' : 'Simpan acara'}
          </button>
          {editing && (
            <button
              type="button"
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
              onClick={resetForm}
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

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="hidden px-4 py-3 sm:table-cell">Tanggal</th>
              <th className="hidden px-4 py-3 md:table-cell">Lokasi</th>
              <th className="px-4 py-3">Tamu</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  Belum ada acara.
                </td>
              </tr>
            )}
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3 font-medium text-stone-900">{ev.name}</td>
                <td className="hidden px-4 py-3 text-stone-600 sm:table-cell">
                  {ev.event_date
                    ? new Date(ev.event_date).toLocaleString()
                    : '—'}
                </td>
                <td className="hidden px-4 py-3 text-stone-600 md:table-cell">
                  {ev.location ?? '—'}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {ev.guests_count ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/admin/events/${ev.id}/invitation`}
                      className="rounded-lg bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-900 hover:bg-pink-100"
                    >
                      Undangan
                    </Link>
                    <Link
                      to={`/admin/events/${ev.id}/guests`}
                      className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                    >
                      Tamu
                    </Link>
                    <Link
                      to={`/admin/events/${ev.id}/envelopes`}
                      className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      Amplop
                    </Link>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 px-3 py-1 text-xs text-stone-700 hover:bg-stone-50"
                      onClick={() => startEdit(ev)}
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => void remove(ev)}
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

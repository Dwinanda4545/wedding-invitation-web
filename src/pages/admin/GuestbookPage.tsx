import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api, ensureCsrfCookie } from '../../lib/api'
import { getEcho } from '../../lib/echo'
import {
  DataTableFooter,
  DataTableToolbar,
  SortableTh,
  useAdminDataTable,
} from '../../components/AdminDataTable'

type EventOption = { id: number; name: string }

type GuestRow = {
  id: number
  name: string
  guest_type: string
  relation?: { id: number; label: string } | null
  is_attended: boolean
  scanned_at: string | null
}

type Summary = {
  total: number
  attended: number
  pending: number
}

export function GuestbookPage() {
  const { user, isAdmin } = useAuth()
  const [events, setEvents] = useState<EventOption[]>([])
  const [eventId, setEventId] = useState<number | ''>('')
  const [guests, setGuests] = useState<GuestRow[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, attended: 0, pending: 0 })
  const [status, setStatus] = useState<'all' | 'attended' | 'pending'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (isAdmin) {
      void api
        .get<{ data: EventOption[] }>('/api/events')
        .then((res) => setEvents(res.data.data.map((e) => ({ id: e.id, name: e.name }))))
        .catch(() => setError('Gagal memuat daftar acara.'))
    } else {
      setEvents(user?.assigned_events ?? [])
    }
  }, [isAdmin, user?.assigned_events])

  useEffect(() => {
    if (events.length === 1 && eventId === '') {
      setEventId(events[0].id)
    }
  }, [events, eventId])

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!eventId) return
    const silent = opts?.silent === true
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const params: Record<string, string> = {}
      if (status !== 'all') params.status = status
      const { data } = await api.get<{ summary: Summary; data: GuestRow[] }>(
        `/api/events/${eventId}/guestbook`,
        { params },
      )
      setSummary(data.summary)
      setGuests(data.data)
    } catch {
      if (!silent) setError('Gagal memuat buku tamu.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [eventId, status])

  useEffect(() => {
    void load()
  }, [load])

  // Poll every 4s while tab is visible so scan check-ins appear without manual refresh.
  useEffect(() => {
    if (!eventId) return

    let intervalId: number | null = null

    const start = () => {
      if (intervalId !== null) return
      intervalId = window.setInterval(() => {
        void load({ silent: true })
      }, 4000)
    }

    const stop = () => {
      if (intervalId === null) return
      window.clearInterval(intervalId)
      intervalId = null
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop()
        return
      }
      void load({ silent: true })
      start()
    }

    if (document.visibilityState !== 'hidden') start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [eventId, load])

  useEffect(() => {
    if (!eventId) return
    const echo = getEcho()
    if (!echo) return

    const channel = echo.private(`event.${eventId}.guestbook`)
    channel.listen('.guest.attendance.updated', (payload: {
      guest_id: number
      name: string
      guest_type: string
      is_attended: boolean
      scanned_at: string | null
    }) => {
      setGuests((prev) => {
        const idx = prev.findIndex((g) => g.id === payload.guest_id)
        const row: GuestRow = {
          id: payload.guest_id,
          name: payload.name,
          guest_type: payload.guest_type,
          relation: prev[idx]?.relation ?? null,
          is_attended: payload.is_attended,
          scanned_at: payload.scanned_at,
        }
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = row
        return next
      })
      void api
        .get<{ summary: Summary }>(`/api/events/${eventId}/guestbook`)
        .then((res) => setSummary(res.data.summary))
        .catch(() => {})
    })

    return () => {
      echo.leave(`event.${eventId}.guestbook`)
    }
  }, [eventId])

  const table = useAdminDataTable(guests, {
    initialSortKey: 'name',
    searchText: (g) =>
      [g.name, g.guest_type, g.relation?.label ?? '', g.is_attended ? 'hadir' : 'belum'].join(' '),
    sortValue: (g, key) => {
      if (key === 'name') return g.name
      if (key === 'type') return g.guest_type
      if (key === 'relation') return g.relation?.label ?? ''
      if (key === 'status') return g.is_attended ? 1 : 0
      if (key === 'time') return g.scanned_at ?? ''
      return ''
    },
  })

  const filteredHint = useMemo(() => {
    if (!eventId) return null
    return 'Status kehadiran diperbarui otomatis setiap beberapa detik.'
  }, [eventId])

  async function toggle(guest: GuestRow) {
    if (!eventId) return
    setBusyId(guest.id)
    setError(null)
    try {
      await ensureCsrfCookie()
      if (guest.is_attended) {
        await api.post(`/api/events/${eventId}/guests/${guest.id}/check-in/cancel`)
      } else {
        await api.post(`/api/events/${eventId}/guests/${guest.id}/check-in`)
      }
      await load()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('Tidak punya akses ke acara ini.')
      } else {
        setError('Gagal mengubah status check-in.')
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Buku Tamu</h1>
        <p className="mt-1 text-sm text-stone-600">
          Pantau kehadiran tamu (auto-refresh) dan check-in manual.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-stone-600">Acara</label>
          <select
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            value={eventId}
            onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Pilih acara…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600">Filter</label>
          <select
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">Semua</option>
            <option value="attended">Sudah check-in</option>
            <option value="pending">Belum check-in</option>
          </select>
        </div>
      </div>

      {eventId ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <div className="text-2xl font-semibold text-stone-900">{summary.total}</div>
            <div className="text-xs text-stone-500">Total</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <div className="text-2xl font-semibold text-emerald-800">{summary.attended}</div>
            <div className="text-xs text-emerald-700">Hadir</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <div className="text-2xl font-semibold text-amber-800">{summary.pending}</div>
            <div className="text-xs text-amber-700">Belum</div>
          </div>
        </div>
      ) : null}

      {filteredHint ? (
        <p className="text-xs text-stone-500">{filteredHint}</p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-4 text-sm text-stone-600">Memuat…</p>
        ) : !eventId ? (
          <p className="p-4 text-sm text-stone-600">Pilih acara terlebih dahulu.</p>
        ) : guests.length === 0 ? (
          <p className="p-4 text-sm text-stone-600">Tidak ada data tamu.</p>
        ) : (
          <>
            <DataTableToolbar
              query={table.query}
              onQueryChange={table.setQuery}
              pageSize={table.pageSize}
              onPageSizeChange={table.setPageSize}
              placeholder="Nama, tipe, relasi"
            />
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <SortableTh
                    label="Nama"
                    active={table.sortKey === 'name'}
                    dir={table.sortDir}
                    onClick={() => table.toggleSort('name')}
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
                    label="Status"
                    active={table.sortKey === 'status'}
                    dir={table.sortDir}
                    onClick={() => table.toggleSort('status')}
                  />
                  <SortableTh
                    label="Waktu"
                    active={table.sortKey === 'time'}
                    dir={table.sortDir}
                    onClick={() => table.toggleSort('time')}
                  />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {table.pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                      Tidak ada data yang cocok.
                    </td>
                  </tr>
                ) : (
                  table.pageRows.map((g) => (
                <tr key={g.id} className="border-b border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-900">{g.name}</td>
                  <td className="px-4 py-3 text-stone-600">{g.guest_type}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {g.relation?.label ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {g.is_attended ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        Hadir
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                        Belum
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {g.scanned_at
                      ? new Date(g.scanned_at).toLocaleString('id-ID')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busyId === g.id}
                      className="rounded-lg border border-stone-200 px-3 py-1 text-xs font-medium hover:bg-stone-50 disabled:opacity-50"
                      onClick={() => void toggle(g)}
                    >
                      {busyId === g.id
                        ? '…'
                        : g.is_attended
                          ? 'Batalkan'
                          : 'Check-in'}
                    </button>
                  </td>
                </tr>
                  ))
                )}
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
          </>
        )}
      </div>
    </div>
  )
}

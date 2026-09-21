import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'

type WishRow = {
  id: number
  guest_name: string
  message: string
  rsvp_status: string
  created_at: string
}

type WishesResponse = {
  event: { id: number; name: string }
  data: WishRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

const RSVP_LABELS: Record<string, string> = {
  pending: 'Belum konfirmasi',
  attending: 'Hadir',
  not_attending: 'Tidak hadir',
}

const RSVP_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  attending: 'bg-emerald-100 text-emerald-800',
  not_attending: 'bg-stone-100 text-stone-600',
}

export function EventWishesPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = id ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<WishesResponse | null>(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    if (!eventId) return
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.get<WishesResponse>(`/api/events/${eventId}/wishes`, {
        params: { page, per_page: 50 },
      })
      setPayload(data)
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setError('Sesi berakhir. Silakan masuk lagi.')
      } else {
        setError('Gagal memuat doa & ucapan.')
      }
    } finally {
      setLoading(false)
    }
  }, [eventId, page])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !payload) {
    return <div className="text-stone-600">Memuat doa & ucapan…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/admin/events"
            className="text-xs font-medium text-rose-700 hover:underline"
          >
            ← Kembali ke Acara
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-black">
            Doa & Ucapan
          </h1>
          <p className="text-sm text-stone-600">
            {payload
              ? `Semua ucapan untuk ${payload.event.name} (${payload.meta.total}).`
              : 'Semua ucapan tamu untuk acara ini.'}
          </p>
        </div>
        <Link
          to={`/admin/events/${eventId}/invitation`}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
        >
          Pengaturan Undangan
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Pesan</th>
              <th className="px-4 py-3">RSVP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {!payload?.data.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                  Belum ada doa & ucapan.
                </td>
              </tr>
            )}
            {payload?.data.map((row) => (
              <tr key={row.id} className="hover:bg-stone-50/80">
                <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                  {new Date(row.created_at).toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 font-medium text-stone-900">{row.guest_name}</td>
                <td className="max-w-md px-4 py-3 text-stone-600 whitespace-pre-wrap">
                  {row.message}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      RSVP_CLASS[row.rsvp_status] ?? 'bg-stone-100 text-stone-700',
                    ].join(' ')}
                  >
                    {RSVP_LABELS[row.rsvp_status] ?? row.rsvp_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payload && payload.meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-stone-600">
            Halaman {payload.meta.current_page} / {payload.meta.last_page}
          </span>
          <button
            type="button"
            disabled={page >= payload.meta.last_page || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  )
}

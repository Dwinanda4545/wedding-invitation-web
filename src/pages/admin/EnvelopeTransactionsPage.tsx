import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import {
  formatIdr,
  type EnvelopeTransactionsResponse,
} from '../../lib/envelopeTypes'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  paid: 'Lunas',
  expired: 'Kedaluwarsa',
  failed: 'Gagal',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-stone-100 text-stone-600',
  failed: 'bg-red-100 text-red-800',
}

export function EnvelopeTransactionsPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = id ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<EnvelopeTransactionsResponse | null>(null)

  const load = useCallback(async () => {
    if (!eventId) return
    setError(null)
    try {
      const { data } = await api.get<EnvelopeTransactionsResponse>(
        `/api/events/${eventId}/envelope-transactions`,
      )
      setPayload(data)
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setError('Sesi berakhir. Silakan masuk lagi.')
      } else {
        setError('Gagal memuat transaksi amplop.')
      }
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <div className="text-stone-600">Memuat transaksi amplop…</div>
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
            Amplop Digital
          </h1>
          <p className="text-sm text-stone-600">
            Daftar transaksi amplop digital tamu (hanya admin).
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

      {payload && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-stone-500">Total terkumpul</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">
              {formatIdr(payload.summary.total_paid_amount)}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-stone-500">Lunas</p>
            <p className="mt-1 text-xl font-semibold text-stone-900">
              {payload.summary.paid_count}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-stone-500">Menunggu</p>
            <p className="mt-1 text-xl font-semibold text-stone-900">
              {payload.summary.pending_count}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Pengirim</th>
              <th className="px-4 py-3">Nominal</th>
              <th className="hidden px-4 py-3 md:table-cell">Ucapan</th>
              <th className="hidden px-4 py-3 sm:table-cell">Metode</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {!payload?.data.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  Belum ada transaksi amplop.
                </td>
              </tr>
            )}
            {payload?.data.map((row) => (
              <tr key={row.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3 text-stone-600">
                  {new Date(row.created_at).toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-stone-900">{row.sender_name}</div>
                  {(row.sender_email || row.sender_phone) && (
                    <div className="text-xs text-stone-500">
                      {[row.sender_email, row.sender_phone].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-stone-900">
                  {formatIdr(row.amount)}
                </td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-stone-600 md:table-cell">
                  {row.message || '—'}
                </td>
                <td className="hidden px-4 py-3 text-stone-600 sm:table-cell">
                  {row.payment_method || '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      STATUS_CLASS[row.status] ?? 'bg-stone-100 text-stone-700',
                    ].join(' ')}
                  >
                    {STATUS_LABELS[row.status] ?? row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

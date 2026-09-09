import axios from 'axios'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ensureCsrfCookie } from '../../lib/api'

type PanitiaRow = {
  id: number
  name: string
  email: string
  role: string
}

type ExistingPanitia = {
  id: number
  name: string
  email: string
  role: string
}

export function EventPanitiaPage() {
  const { id } = useParams()
  const eventId = Number(id)
  const [list, setList] = useState<PanitiaRow[]>([])
  const [allPanitia, setAllPanitia] = useState<ExistingPanitia[]>([])
  const [assignId, setAssignId] = useState<number | ''>('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!eventId) return
    setError(null)
    try {
      const [assigned, users] = await Promise.all([
        api.get<{ data: PanitiaRow[] }>(`/api/events/${eventId}/panitia`),
        api.get<{ data: ExistingPanitia[] }>('/api/users'),
      ])
      setList(assigned.data.data)
      setAllPanitia(users.data.data.filter((u) => u.role === 'panitia'))
    } catch {
      setError('Gagal memuat panitia.')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  async function assignExisting(e: FormEvent) {
    e.preventDefault()
    if (!assignId) return
    try {
      await ensureCsrfCookie()
      await api.post(`/api/events/${eventId}/panitia`, { user_id: assignId })
      setAssignId('')
      await load()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError('Gagal assign panitia.')
      }
    }
  }

  async function createAndAssign(e: FormEvent) {
    e.preventDefault()
    try {
      await ensureCsrfCookie()
      await api.post(`/api/events/${eventId}/panitia`, { name, email, password })
      setName('')
      setEmail('')
      setPassword('')
      await load()
    } catch {
      setError('Gagal membuat panitia.')
    }
  }

  async function unassign(userId: number) {
    try {
      await ensureCsrfCookie()
      await api.delete(`/api/events/${eventId}/panitia/${userId}`)
      await load()
    } catch {
      setError('Gagal melepas panitia.')
    }
  }

  const available = allPanitia.filter((p) => !list.some((l) => l.id === p.id))

  if (loading) {
    return <p className="text-sm text-stone-600">Memuat…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/admin/events" className="text-xs text-rose-700 hover:underline">
          ← Kembali ke acara
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">Panitia Acara</h1>
        <p className="mt-1 text-sm text-stone-600">
          Assign panitia yang boleh scan & buku tamu untuk acara ini.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Panitia assigned</h2>
        {list.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Belum ada panitia.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {list.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium text-stone-900">{p.name}</div>
                  <div className="text-xs text-stone-500">{p.email}</div>
                </div>
                <button
                  type="button"
                  className="text-xs text-stone-500 hover:text-rose-700"
                  onClick={() => void unassign(p.id)}
                >
                  Lepas
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={assignExisting}
        className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-stone-900">Assign panitia existing</h2>
        <select
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          value={assignId}
          onChange={(e) => setAssignId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Pilih panitia…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.email})
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!assignId}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          Assign
        </button>
      </form>

      <form
        onSubmit={createAndAssign}
        className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-stone-900">Buat panitia baru + assign</h2>
        <input
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          placeholder="Nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Buat & assign
        </button>
      </form>
    </div>
  )
}

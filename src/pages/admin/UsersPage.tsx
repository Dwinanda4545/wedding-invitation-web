import axios from 'axios'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { api, ensureCsrfCookie } from '../../lib/api'

type EventOption = { id: number; name: string }

type UserRow = {
  id: number
  name: string
  email: string
  role: 'admin' | 'panitia'
  assigned_events: EventOption[]
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'panitia' as 'admin' | 'panitia',
  eventIds: [] as number[],
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [usersRes, eventsRes] = await Promise.all([
        api.get<{ data: UserRow[] }>('/api/users'),
        api.get<{ data: EventOption[] }>('/api/events'),
      ])
      setUsers(usersRes.data.data)
      setEvents(eventsRes.data.data.map((e) => ({ id: e.id, name: e.name })))
    } catch {
      setError('Gagal memuat data users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function startCreate() {
    setEditing(null)
    setForm(emptyForm)
  }

  function startEdit(user: UserRow) {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      eventIds: user.assigned_events.map((e) => e.id),
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await ensureCsrfCookie()
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        event_ids: form.role === 'panitia' ? form.eventIds : [],
        ...(form.password ? { password: form.password } : {}),
      }
      if (editing) {
        await api.put(`/api/users/${editing.id}`, payload)
      } else {
        await api.post('/api/users', {
          ...payload,
          password: form.password,
        })
      }
      setForm(emptyForm)
      setEditing(null)
      await load()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string; errors?: Record<string, string[]> })
            ?.errors
        setError(
          msg
            ? Object.values(msg).flat()[0] ?? 'Gagal menyimpan user.'
            : 'Gagal menyimpan user.',
        )
      } else {
        setError('Gagal menyimpan user.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(user: UserRow) {
    if (!window.confirm(`Hapus user ${user.name}?`)) return
    setError(null)
    try {
      await ensureCsrfCookie()
      await api.delete(`/api/users/${user.id}`)
      await load()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errors = (err.response?.data as { errors?: Record<string, string[]> })?.errors
        setError(errors ? Object.values(errors).flat()[0] : 'Gagal menghapus user.')
      } else {
        setError('Gagal menghapus user.')
      }
    }
  }

  function toggleEvent(id: number) {
    setForm((f) => ({
      ...f,
      eventIds: f.eventIds.includes(id)
        ? f.eventIds.filter((x) => x !== id)
        : [...f.eventIds, id],
    }))
  }

  if (loading) {
    return <p className="text-sm text-stone-600">Memuat users…</p>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Users</h1>
        <p className="mt-1 text-sm text-stone-600">
          Kelola akun admin dan panitia. Panitia hanya akses acara yang di-assign.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-stone-900">
            {editing ? `Edit: ${editing.name}` : 'Tambah user'}
          </h2>
          {editing ? (
            <button
              type="button"
              className="text-xs text-stone-500 hover:text-stone-800"
              onClick={startCreate}
            >
              Batal edit
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-stone-600">Nama</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">
              Password {editing ? '(opsional)' : ''}
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required={!editing}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">Role</label>
            <select
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value as 'admin' | 'panitia',
                }))
              }
            >
              <option value="admin">Admin</option>
              <option value="panitia">Panitia</option>
            </select>
          </div>
        </div>

        {form.role === 'panitia' ? (
          <div>
            <label className="text-xs font-medium text-stone-600">Acara assigned</label>
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-stone-200 p-3">
              {events.length === 0 ? (
                <p className="text-xs text-stone-500">Belum ada acara.</p>
              ) : (
                events.map((ev) => (
                  <label key={ev.id} className="flex items-center gap-2 text-sm text-stone-700">
                    <input
                      type="checkbox"
                      checked={form.eventIds.includes(ev.id)}
                      onChange={() => toggleEvent(ev.id)}
                    />
                    {ev.name}
                  </label>
                ))
              )}
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah user'}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Acara</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-stone-100">
                <td className="px-4 py-3 font-medium text-stone-900">{u.name}</td>
                <td className="px-4 py-3 text-stone-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs capitalize">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {u.role === 'admin'
                    ? 'Semua'
                    : u.assigned_events.map((e) => e.name).join(', ') || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="mr-2 text-xs font-medium text-rose-700 hover:underline"
                    onClick={() => startEdit(u)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-stone-500 hover:underline"
                    onClick={() => void onDelete(u)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

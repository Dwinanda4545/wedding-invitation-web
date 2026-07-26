import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to="/admin/events" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      navigate('/admin/events')
    } catch {
      setError('Email atau kata sandi salah.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-rose-900/5">
        <h1 className="font-serif text-2xl font-semibold text-stone-900">
          Masuk CMS
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Kelola acara, tamu, dan check-in.
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-medium text-stone-600" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              className="text-xs font-medium text-stone-600"
              htmlFor="password"
            >
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? 'Memproses…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-rose-100 text-rose-900'
      : 'text-stone-700 hover:bg-stone-100',
  ].join(' ')

export function AdminLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white px-4 py-6 md:block">
        <div className="mb-8 px-2">
          <div className="text-xs uppercase tracking-wide text-stone-400">
            Admin
          </div>
          <div className="font-semibold text-stone-900">Undangan Digital</div>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink to="/admin/events" className={linkClass}>
            Acara
          </NavLink>
          <NavLink to="/admin/scanner" className={linkClass}>
            Scan Check-in
          </NavLink>
        </nav>
        <p className="mt-6 px-2 text-xs leading-relaxed text-stone-400">
          Kelola tema, HTML, dan section undangan lewat tombol{' '}
          <span className="font-medium text-stone-500">Undangan</span> pada
          setiap acara.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:px-8">
          <div className="md:hidden">
            <div className="text-sm font-semibold text-stone-900">Admin</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-stone-600 sm:inline">
              {user?.name}
            </span>
            <button
              type="button"
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              onClick={() => {
                void logout().finally(() => navigate('/login', { replace: true }))
              }}
            >
              Keluar
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>

        <nav className="sticky bottom-0 flex justify-around border-t border-stone-200 bg-white px-2 py-2 md:hidden">
          <NavLink
            to="/admin/events"
            className={({ isActive }) =>
              [
                'flex-1 rounded-lg py-2 text-center text-xs font-medium',
                isActive ? 'bg-rose-50 text-rose-900' : 'text-stone-600',
              ].join(' ')
            }
          >
            Acara
          </NavLink>
          <NavLink
            to="/admin/scanner"
            className={({ isActive }) =>
              [
                'flex-1 rounded-lg py-2 text-center text-xs font-medium',
                isActive ? 'bg-rose-50 text-rose-900' : 'text-stone-600',
              ].join(' ')
            }
          >
            Scan
          </NavLink>
        </nav>
      </div>
    </div>
  )
}

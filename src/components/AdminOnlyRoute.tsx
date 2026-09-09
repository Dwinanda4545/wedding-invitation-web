import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AdminOnlyRoute() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-600">
        Memuat…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/admin/scanner" replace />
  }

  return <Outlet />
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminLayout } from './components/AdminLayout'
import { AdminOnlyRoute } from './components/AdminOnlyRoute'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { EventsPage } from './pages/admin/EventsPage'
import { EventPanitiaPage } from './pages/admin/EventPanitiaPage'
import { GuestsPage } from './pages/admin/GuestsPage'
import { GuestbookPage } from './pages/admin/GuestbookPage'
import { InvitationContentPage } from './pages/admin/InvitationContentPage'
import { EnvelopeTransactionsPage } from './pages/admin/EnvelopeTransactionsPage'
import { ScannerPage } from './pages/admin/ScannerPage'
import { UsersPage } from './pages/admin/UsersPage'
import { InvitationPage } from './pages/public/InvitationPage'

function HomeRedirect() {
  const { user, loading, isAdmin } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-600">
        Memuat…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={isAdmin ? '/admin/events' : '/admin/scanner'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/invitation/:secret_token"
            element={<InvitationPage />}
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route element={<AdminOnlyRoute />}>
                <Route path="/admin/events" element={<EventsPage />} />
                <Route path="/admin/events/:id/invitation" element={<InvitationContentPage />} />
                <Route path="/admin/events/:id/envelopes" element={<EnvelopeTransactionsPage />} />
                <Route path="/admin/events/:id/guests" element={<GuestsPage />} />
                <Route path="/admin/events/:id/panitia" element={<EventPanitiaPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
              </Route>
              <Route path="/admin/scanner" element={<ScannerPage />} />
              <Route path="/admin/guestbook" element={<GuestbookPage />} />
            </Route>
          </Route>

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminLayout } from './components/AdminLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { EventsPage } from './pages/admin/EventsPage'
import { GuestsPage } from './pages/admin/GuestsPage'
import { InvitationContentPage } from './pages/admin/InvitationContentPage'
import { EnvelopeTransactionsPage } from './pages/admin/EnvelopeTransactionsPage'
import { ScannerPage } from './pages/admin/ScannerPage'
import { InvitationPage } from './pages/public/InvitationPage'

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
              <Route path="/admin/events" element={<EventsPage />} />
              <Route path="/admin/events/:id/invitation" element={<InvitationContentPage />} />
              <Route path="/admin/events/:id/envelopes" element={<EnvelopeTransactionsPage />} />
              <Route path="/admin/events/:id/guests" element={<GuestsPage />} />
              <Route path="/admin/scanner" element={<ScannerPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/admin/events" replace />} />
          <Route path="*" element={<Navigate to="/admin/events" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

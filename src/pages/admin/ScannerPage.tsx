import axios from 'axios'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

type ToastState =
  | { kind: 'idle' }
  | { kind: 'success'; title: string; subtitle?: string }
  | { kind: 'error'; title: string; subtitle?: string }

type EventOption = { id: number; name: string }

function parseToken(text: string): string {
  const t = text.trim()
  const m = t.match(/\/invitation\/([A-Za-z0-9]+)/)
  if (m?.[1]) return m[1]
  return t
}

export function ScannerPage() {
  const { user, isAdmin } = useAuth()
  const [events, setEvents] = useState<EventOption[]>([])
  const [eventId, setEventId] = useState<number | ''>('')
  const [toast, setToast] = useState<ToastState>({ kind: 'idle' })
  const busyRef = useRef(false)
  const eventIdRef = useRef<number | ''>('')

  useEffect(() => {
    eventIdRef.current = eventId
  }, [eventId])

  useEffect(() => {
    if (isAdmin) {
      void api
        .get<{ data: EventOption[] }>('/api/events')
        .then((res) => setEvents(res.data.data.map((e) => ({ id: e.id, name: e.name }))))
    } else {
      setEvents(user?.assigned_events ?? [])
    }
  }, [isAdmin, user?.assigned_events])

  useEffect(() => {
    if (events.length === 1 && eventId === '') {
      setEventId(events[0].id)
    }
  }, [events, eventId])

  useEffect(() => {
    if (!eventId) return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        rememberLastUsedCamera: true,
      },
      false,
    )
    const onScan = async (decodedText: string) => {
      if (busyRef.current) return
      const selectedEventId = eventIdRef.current
      if (!selectedEventId) {
        setToast({
          kind: 'error',
          title: 'Pilih acara dulu',
          subtitle: 'Check-in membutuhkan acara aktif.',
        })
        return
      }
      const token = parseToken(decodedText)
      if (!token) return

      busyRef.current = true
      try {
        const { data } = await api.post<{
          success: boolean
          message: string
          guest?: { name?: string }
        }>('/api/check-in', {
          secret_token: token,
          event_id: selectedEventId,
        })

        if (data.success) {
          setToast({
            kind: 'success',
            title: data.message,
            subtitle: data.guest?.name ? `Tamu: ${data.guest.name}` : undefined,
          })
        } else {
          setToast({
            kind: 'error',
            title: data.message,
            subtitle: data.guest?.name ? `Tamu: ${data.guest.name}` : undefined,
          })
        }
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setToast({
            kind: 'error',
            title: 'QR tidak valid',
            subtitle: 'Token tidak dikenali untuk acara ini.',
          })
        } else if (axios.isAxiosError(e) && e.response?.status === 403) {
          setToast({
            kind: 'error',
            title: 'Akses ditolak',
            subtitle: 'Anda tidak punya akses ke acara ini.',
          })
        } else if (axios.isAxiosError(e) && e.response?.status === 401) {
          setToast({
            kind: 'error',
            title: 'Belum masuk',
            subtitle: 'Silakan login ulang.',
          })
        } else if (axios.isAxiosError(e) && e.response?.status === 422) {
          setToast({
            kind: 'error',
            title: 'Data tidak lengkap',
            subtitle: 'Pastikan acara sudah dipilih.',
          })
        } else {
          setToast({
            kind: 'error',
            title: 'Check-in gagal',
            subtitle: 'Periksa koneksi ke server.',
          })
        }
      } finally {
        window.setTimeout(() => {
          busyRef.current = false
        }, 1200)
      }
    }

    scanner.render(onScan, () => {})

    return () => {
      void scanner.clear().catch(() => {})
    }
  }, [eventId])

  useEffect(() => {
    if (toast.kind === 'idle') return
    const t = window.setTimeout(() => setToast({ kind: 'idle' }), 4500)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Scan Check-in</h1>
        <p className="mt-1 text-sm text-stone-600">
          Pilih acara, lalu scan QR undangan tamu.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-stone-600">Acara</label>
        <select
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
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

      {!eventId ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Pilih acara sebelum mengaktifkan kamera.
        </p>
      ) : (
        <div
          id="qr-reader"
          className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
        />
      )}

      {toast.kind !== 'idle' ? (
        <div
          className={[
            'rounded-xl border px-4 py-3 text-sm',
            toast.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900',
          ].join(' ')}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.subtitle ? <div className="mt-0.5 opacity-80">{toast.subtitle}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

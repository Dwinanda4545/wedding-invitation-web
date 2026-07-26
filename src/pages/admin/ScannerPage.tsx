import axios from 'axios'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'

type ToastState =
  | { kind: 'idle' }
  | { kind: 'success'; title: string; subtitle?: string }
  | { kind: 'error'; title: string; subtitle?: string }

function parseToken(text: string): string {
  const t = text.trim()
  const m = t.match(/\/invitation\/([A-Za-z0-9]+)/)
  if (m?.[1]) return m[1]
  return t
}

export function ScannerPage() {
  const [toast, setToast] = useState<ToastState>({ kind: 'idle' })
  const busyRef = useRef(false)

  useEffect(() => {
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
      const token = parseToken(decodedText)
      if (!token) return

      busyRef.current = true
      try {
        const { data } = await api.post<{
          success: boolean
          message: string
          guest?: { name?: string }
        }>('/api/check-in', { secret_token: token })

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
            subtitle: 'Token tidak dikenali.',
          })
        } else if (axios.isAxiosError(e) && e.response?.status === 401) {
          setToast({
            kind: 'error',
            title: 'Belum masuk',
            subtitle: 'Silakan login ulang.',
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
  }, [])

  useEffect(() => {
    if (toast.kind === 'idle') return
    const t = window.setTimeout(() => setToast({ kind: 'idle' }), 4500)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-stone-900">
          Scan check-in
        </h1>
        <p className="text-sm text-stone-600">
          Arahkan kamera ke QR tamu. Token akan dikirim ke server untuk
          verifikasi.
        </p>
      </div>

      <div
        id="qr-reader"
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm [&_*]:font-sans"
      />

      {toast.kind !== 'idle' && (
        <div
          role="status"
          className={[
            'fixed inset-x-4 top-6 z-50 mx-auto max-w-lg rounded-2xl px-6 py-6 text-center shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2',
            toast.kind === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white',
          ].join(' ')}
        >
          <div className="text-2xl font-bold tracking-tight">{toast.title}</div>
          {toast.subtitle && (
            <div className="mt-2 text-lg opacity-95">{toast.subtitle}</div>
          )}
        </div>
      )}
    </div>
  )
}

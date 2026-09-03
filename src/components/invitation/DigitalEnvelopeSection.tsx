import axios from 'axios'
import { type FormEvent, useMemo, useState } from 'react'
import type { DigitalEnvelopeSettings } from '../../lib/envelopeTypes'
import {
  formatIdr,
  mergeDigitalEnvelopeSettings,
  type CreateEnvelopeResponse,
  type EnvelopePaymentResult,
} from '../../lib/envelopeTypes'
import { api } from '../../lib/api'
import { SectionTitle } from './SectionTitle'

type Props = {
  secretToken: string
  guestName: string
  envelopeSettings?: DigitalEnvelopeSettings | null
  paymentResult?: EnvelopePaymentResult
  tagColor?: string
  title?: string
  showTitle?: boolean
}

export function DigitalEnvelopeSection({
  secretToken,
  guestName,
  envelopeSettings,
  paymentResult = null,
  tagColor,
  title = 'Amplop Digital',
  showTitle = true,
}: Props) {
  const settings = useMemo(
    () => mergeDigitalEnvelopeSettings(envelopeSettings),
    [envelopeSettings],
  )

  const [senderName, setSenderName] = useState(guestName)
  const [senderEmail, setSenderEmail] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState<number | null>(settings.presets[1] ?? 100000)
  const [customAmount, setCustomAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAmount = amount ?? (Number(customAmount.replace(/\D/g, '')) || 0)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedAmount || selectedAmount < settings.min_amount) {
      setError(`Nominal minimal ${formatIdr(settings.min_amount)}.`)
      return
    }
    if (selectedAmount > settings.max_amount) {
      setError(`Nominal maksimal ${formatIdr(settings.max_amount)}.`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { data } = await api.post<CreateEnvelopeResponse>(
        `/api/invitation/${secretToken}/digital-envelopes`,
        {
          sender_name: senderName.trim() || guestName,
          sender_email: senderEmail.trim() || null,
          sender_phone: senderPhone.trim() || null,
          amount: selectedAmount,
          message: message.trim() || null,
        },
      )

      window.location.href = data.data.payment_url
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setError('Amplop digital tidak tersedia untuk undangan ini.')
        } else if (err.response?.status === 422) {
          const errors = err.response.data?.errors as Record<string, string[]> | undefined
          const first = errors ? Object.values(errors).flat()[0] : null
          setError(first ?? 'Data tidak valid.')
        } else if (err.response?.status === 503) {
          setError('Layanan pembayaran sedang tidak tersedia. Coba lagi.')
        } else {
          setError('Gagal memproses amplop digital.')
        }
      } else {
        setError('Gagal memproses amplop digital.')
      }
      setSubmitting(false)
    }
  }

  if (paymentResult === 'success') {
    return (
      <section className="inv-section inv-animate-fade-up">
        <SectionTitle title={title} show={showTitle} tagColor={tagColor} />
        <div
          className="mx-auto max-w-md rounded-2xl p-6 text-center"
          style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}
        >
          <p className="text-lg font-semibold text-emerald-100">Terima kasih!</p>
          <p className="mt-2 text-sm opacity-90">
            Amplop digital Anda telah kami terima. Doa restu Anda sangat berarti bagi
            kami.
          </p>
        </div>
      </section>
    )
  }

  if (paymentResult === 'pending') {
    return (
      <section className="inv-section inv-animate-fade-up">
        <SectionTitle title={title} show={showTitle} tagColor={tagColor} />
        <div
          className="mx-auto max-w-md rounded-2xl p-6 text-center"
          style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}
        >
          <p className="text-lg font-semibold">Pembayaran diproses</p>
          <p className="mt-2 text-sm opacity-90">
            Pembayaran Anda sedang diverifikasi. Status akan diperbarui setelah
            konfirmasi.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="inv-section inv-animate-fade-up">
      <SectionTitle title={title} show={showTitle} tagColor={tagColor} />

      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-md space-y-3 rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
      >
        <p className="text-center text-xs opacity-75">
          Kirim tanda kasih secara digital. Pembayaran aman melalui Duitku.
        </p>

        <div>
          <label className="text-xs opacity-70">Nama Pengirim</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs opacity-70">Nominal Amplop</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {settings.presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset)
                  setCustomAmount('')
                }}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  amount === preset
                    ? 'bg-white/40 ring-1 ring-white/60'
                    : 'bg-white/15 hover:bg-white/25',
                ].join(' ')}
              >
                {formatIdr(preset)}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={settings.min_amount}
            max={settings.max_amount}
            placeholder={`Custom (min ${formatIdr(settings.min_amount)})`}
            className="mt-2 w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value)
              setAmount(null)
            }}
          />
        </div>

        <div>
          <label className="text-xs opacity-70">Ucapan / Doa (opsional)</label>
          <textarea
            className="mt-1 min-h-[72px] w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs opacity-70">Email (opsional)</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs opacity-70">Telepon (opsional)</label>
            <input
              type="tel"
              className="mt-1 w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
            />
          </div>
        </div>

        {paymentResult === 'failed' && (
          <p className="text-xs text-amber-200">
            Pembayaran dibatalkan atau gagal. Silakan coba lagi.
          </p>
        )}
        {error && <p className="text-xs text-red-200">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full py-2 text-sm font-semibold uppercase tracking-wider disabled:opacity-60"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        >
          {submitting ? 'Memproses…' : `Kirim ${formatIdr(selectedAmount)}`}
        </button>
      </form>
    </section>
  )
}

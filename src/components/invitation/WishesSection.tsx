import { type FormEvent, useState } from 'react'
import type { InvitationWish } from '../../lib/invitationTypes'
import { api } from '../../lib/api'

type Props = {
  secretToken: string
  guestName: string
  wishes: InvitationWish[]
  onWishAdded: (wish: InvitationWish) => void
  tagColor?: string
}

export function WishesSection({
  secretToken,
  guestName,
  wishes,
  onWishAdded,
  tagColor,
}: Props) {
  const [name, setName] = useState(guestName)
  const [message, setMessage] = useState('')
  const [rsvp, setRsvp] = useState<'attending' | 'not_attending' | 'pending'>(
    'pending',
  )
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError(null)
    try {
      const { data } = await api.post<{ data: InvitationWish }>(
        `/api/invitation/${secretToken}/wishes`,
        {
          guest_name: name.trim() || guestName,
          message: message.trim(),
          rsvp_status: rsvp,
        },
      )
      onWishAdded(data.data)
      setMessage('')
      setSent(true)
      window.setTimeout(() => setSent(false), 2500)
    } catch {
      setError('Gagal mengirim ucapan.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="inv-section inv-animate-fade-up">
      <h2 className="inv-section-title" style={{ color: tagColor }}>
        Doa & Ucapan
      </h2>

      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-md space-y-3 rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
      >
        <div>
          <label className="text-xs opacity-70">Nama</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs opacity-70">Pesan untuk Mempelai</label>
          <textarea
            className="mt-1 min-h-[80px] w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs opacity-70">RSVP / Kehadiran</label>
          <select
            className="mt-1 w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none"
            value={rsvp}
            onChange={(e) =>
              setRsvp(e.target.value as 'attending' | 'not_attending' | 'pending')
            }
          >
            <option value="pending">Belum konfirmasi</option>
            <option value="attending">Hadir</option>
            <option value="not_attending">Tidak hadir</option>
          </select>
        </div>
        {error && <p className="text-xs text-red-200">{error}</p>}
        {sent && <p className="text-xs text-emerald-200">Ucapan terkirim!</p>}
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-full py-2 text-sm font-semibold uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        >
          {sending ? 'Mengirim…' : 'Kirim Ucapan'}
        </button>
      </form>

      {wishes.length > 0 && (
        <div className="mx-auto mt-8 max-w-md">
          <p className="mb-4 text-center text-xs uppercase tracking-wider opacity-60">
            Doa & Ucapan dari tamu
          </p>
          {wishes.map((w) => (
            <div key={w.id} className="inv-wish-card">
              <p className="text-sm font-semibold" style={{ color: tagColor }}>
                {w.guest_name}
              </p>
              <p className="mt-1 text-sm opacity-85">{w.message}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mx-auto mt-8 max-w-md text-center text-sm italic opacity-75">
        Atas doa & ucapan Bapak/Ibu/Saudara/i, kami mengucapkan terima kasih.
      </p>
    </section>
  )
}

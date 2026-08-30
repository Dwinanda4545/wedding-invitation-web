import { type FormEvent, useState } from 'react'
import axios from 'axios'
import type { InvitationWish } from '../../lib/invitationTypes'
import { api } from '../../lib/api'
import { SectionTitle } from './SectionTitle'

type RsvpStatus = InvitationWish['rsvp_status']

type Props = {
  secretToken: string
  guestName: string
  wishes: InvitationWish[]
  myWish?: InvitationWish | null
  onWishChanged: (wish: InvitationWish) => void
  tagColor?: string
  title?: string
  showTitle?: boolean
}

export function WishesSection({
  secretToken,
  guestName,
  wishes,
  myWish = null,
  onWishChanged,
  tagColor,
  title = 'Doa & Ucapan',
  showTitle = true,
}: Props) {
  const [name, setName] = useState(myWish?.guest_name || guestName)
  const [message, setMessage] = useState(myWish?.message ?? '')
  const [rsvp, setRsvp] = useState<RsvpStatus>(myWish?.rsvp_status ?? 'pending')
  const [sentWish, setSentWish] = useState<InvitationWish | null>(myWish ?? null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const alreadySent = Boolean(sentWish)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!alreadySent && !message.trim()) return
    setSending(true)
    setError(null)
    setNotice(null)
    try {
      if (alreadySent) {
        const { data } = await api.patch<{ data: InvitationWish }>(
          `/api/invitation/${secretToken}/wishes`,
          { rsvp_status: rsvp },
        )
        setSentWish(data.data)
        onWishChanged(data.data)
        setNotice('Kehadiran diperbarui.')
      } else {
        if (!message.trim()) return
        const { data } = await api.post<{ data: InvitationWish }>(
          `/api/invitation/${secretToken}/wishes`,
          {
            guest_name: name.trim() || guestName,
            message: message.trim(),
            rsvp_status: rsvp,
          },
        )
        setSentWish(data.data)
        setMessage(data.data.message)
        setName(data.data.guest_name)
        setRsvp(data.data.rsvp_status)
        onWishChanged(data.data)
        setNotice('Ucapan terkirim!')
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        const existing = e.response.data?.data as InvitationWish | undefined
        if (existing) {
          setSentWish(existing)
          setMessage(existing.message)
          setName(existing.guest_name)
          setRsvp(existing.rsvp_status)
          onWishChanged(existing)
        }
        setError('Ucapan sudah dikirim. Kehadiran masih bisa diubah.')
      } else {
        setError(alreadySent ? 'Gagal memperbarui kehadiran.' : 'Gagal mengirim ucapan.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="inv-section inv-animate-fade-up">
      <SectionTitle title={title} show={showTitle} tagColor={tagColor} />

      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-md space-y-3 rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
      >
        <div>
          <label className="text-xs opacity-70">Nama</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none disabled:opacity-70"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={alreadySent}
          />
        </div>
        <div>
          <label className="text-xs opacity-70">Pesan untuk Mempelai</label>
          <textarea
            className="mt-1 min-h-[80px] w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none disabled:opacity-70"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required={!alreadySent}
            disabled={alreadySent}
            readOnly={alreadySent}
          />
          {alreadySent && (
            <p className="mt-1 text-[11px] opacity-60">Pesan hanya bisa dikirim sekali.</p>
          )}
        </div>
        <div>
          <label className="text-xs opacity-70">RSVP / Kehadiran</label>
          <select
            className="mt-1 w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm outline-none"
            value={rsvp}
            onChange={(e) => setRsvp(e.target.value as RsvpStatus)}
          >
            <option value="pending">Belum konfirmasi</option>
            <option value="attending">Hadir</option>
            <option value="not_attending">Tidak hadir</option>
          </select>
        </div>
        {error && <p className="text-xs text-red-200">{error}</p>}
        {notice && <p className="text-xs text-emerald-200">{notice}</p>}
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-full py-2 text-sm font-semibold uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        >
          {sending
            ? alreadySent
              ? 'Menyimpan…'
              : 'Mengirim…'
            : alreadySent
              ? 'Simpan Kehadiran'
              : 'Kirim Ucapan'}
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

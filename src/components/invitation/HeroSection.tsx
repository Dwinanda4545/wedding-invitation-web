import type { CoupleInfo, InvitationSettings } from '../../lib/invitationTypes'
import { formatEventDate } from '../../lib/invitationTypes'
import { CountdownTimer } from './CountdownTimer'

type Props = {
  eventName: string
  eventDate?: string | null
  coupleInfo: CoupleInfo
  settings: InvitationSettings
  tagColor?: string
}

export function HeroSection({
  eventName,
  eventDate,
  coupleInfo,
  settings,
  tagColor,
}: Props) {
  const initial = coupleInfo.couple_initial?.trim()

  return (
    <section className="inv-section inv-animate-fade-up text-center">
      <p className="text-xs uppercase tracking-[0.3em] opacity-70">
        We are getting married
      </p>
      <h1
        className="mt-4 font-serif text-4xl font-semibold leading-tight"
        style={{ color: tagColor }}
      >
        {eventName}
      </h1>
      <p className="mt-3 text-sm opacity-80" style={{ color: tagColor }}>
        {formatEventDate(eventDate)}
      </p>
      {initial && (
        <p className="mt-6 font-serif text-lg tracking-[0.3em] opacity-60">
          -{initial}-
        </p>
      )}
      {settings.countdown_enabled && (
        <>
          <p className="mt-8 text-xs uppercase tracking-[0.2em] opacity-60">
            Save the Date
          </p>
          <CountdownTimer targetDate={eventDate} />
        </>
      )}
    </section>
  )
}

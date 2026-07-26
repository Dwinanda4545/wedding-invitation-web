import type { EventSchedule } from '../../lib/invitationTypes'
import { formatScheduleDate, formatTimeRange } from '../../lib/invitationTypes'

type Props = {
  schedules: EventSchedule[]
  fallbackDate?: string | null
  fallbackLocation?: string | null
  tagColor?: string
}

export function ScheduleSection({
  schedules,
  fallbackDate,
  fallbackLocation,
  tagColor,
}: Props) {
  const items =
    schedules.length > 0
      ? schedules
      : fallbackDate || fallbackLocation
        ? [
            {
              title: 'Acara Utama',
              event_date: fallbackDate?.slice(0, 10) ?? null,
              start_time: null,
              end_time: null,
              venue: fallbackLocation ?? null,
              address: null,
              maps_url: null,
            },
          ]
        : []

  if (items.length === 0) return null

  return (
    <section className="inv-section inv-animate-fade-up">
      <h2 className="inv-section-title" style={{ color: tagColor }}>
        Detail Acara
      </h2>
      <div className="mx-auto max-w-md space-y-6">
        {items.map((item, idx) => (
          <div
            key={item.id ?? idx}
            className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
          >
            <h3 className="font-serif text-xl font-semibold" style={{ color: tagColor }}>
              {item.title}
            </h3>
            <div className="inv-divider" />
            {item.event_date && (
              <p className="text-sm opacity-90" style={{ color: tagColor }}>
                {formatScheduleDate(item.event_date)}
              </p>
            )}
            {formatTimeRange(item.start_time, item.end_time) && (
              <p className="mt-1 text-sm opacity-80" style={{ color: tagColor }}>
                {formatTimeRange(item.start_time, item.end_time)}
              </p>
            )}
            {item.venue && (
              <p className="mt-3 font-medium" style={{ color: tagColor }}>
                {item.venue}
              </p>
            )}
            {item.address && (
              <p className="mt-1 text-sm opacity-75">{item.address}</p>
            )}
            {item.maps_url && (
              <a
                href={item.maps_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider opacity-80 transition hover:opacity-100"
              >
                Buka Map
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

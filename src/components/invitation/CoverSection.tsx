import type { InvitationSettings } from '../../lib/invitationTypes'
import { getSectionBackground, guestTypeLabel } from '../../lib/invitationTypes'

type Props = {
  settings: InvitationSettings
  eventName: string
  eventDateLabel: string
  guestName: string
  guestType: string
  onOpen: () => void
  style: React.CSSProperties
  tagColor?: string
}

export function CoverSection({
  settings,
  eventName,
  eventDateLabel,
  guestName,
  guestType,
  onOpen,
  style,
  isOpen,
  tagColor,
}: Props & { isOpen: boolean }) {
  if (!settings.cover_enabled) return null

  const coverBg = getSectionBackground(settings, 'cover')
  const bgUrl = coverBg?.image_url?.trim()
  const overlay = coverBg?.overlay ?? 0.25
  const minHeight =
    typeof coverBg?.min_height_px === 'number' && coverBg.min_height_px > 0
      ? coverBg.min_height_px
      : undefined
  const lineHeight =
    typeof coverBg?.line_height === 'number' && coverBg.line_height > 0
      ? coverBg.line_height
      : undefined

  return (
    <div
      className={[
        'inv-cover',
        isOpen ? 'is-open' : '',
        lineHeight ? 'inv-section-line-spaced' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        ...(minHeight ? { minHeight } : {}),
        ...(lineHeight
          ? ({
              lineHeight,
              ['--inv-section-line-height' as string]: String(lineHeight),
            } as React.CSSProperties)
          : {}),
      }}
      data-inv-line-height={lineHeight || undefined}
    >
      {bgUrl && (
        <>
          <img src={bgUrl} alt="" className="inv-cover-bg-img" draggable={false} />
          {overlay > 0 && (
            <div
              className="inv-cover-bg-overlay"
              style={{ opacity: Math.min(overlay, 0.85) }}
            />
          )}
        </>
      )}

      <p
        className="inv-animate-fade-in text-xs uppercase tracking-[0.35em]"
        style={{ animationDelay: '0.2s' }}
      >
        {settings.cover_subtitle ?? 'You are invited to our wedding'}
      </p>
      <h1
        className="inv-animate-scale-in mt-4 font-serif text-4xl font-semibold"
        style={{ animationDelay: '0.4s', color: tagColor }}
      >
        {eventName}
      </h1>
      <p
        className="inv-animate-fade-in mt-3 text-sm opacity-80"
        style={{ animationDelay: '0.5s', color: tagColor }}
      >
        {eventDateLabel}
      </p>
      <div className="inv-animate-fade-up mt-8" style={{ animationDelay: '0.6s' }}>
        <p className="text-xs tracking-wide opacity-70">Kepada Yth. Bpk/Ibu/Saudara/i</p>
        <p className="mt-2 font-serif text-xl font-semibold" style={{ color: tagColor }}>
          {guestName}
        </p>
        <p className="mt-1 text-xs opacity-60" style={{ color: tagColor }}>
          {guestTypeLabel(guestType)}
        </p>
      </div>
      {!isOpen && (
        <button
          type="button"
          className="inv-cover-btn inv-animate-fade-up"
          style={{ animationDelay: '0.8s' }}
          onClick={onOpen}
        >
          Buka Undangan
        </button>
      )}
      {settings.cover_title && (
        <p className="inv-animate-fade-in mt-8 text-xs tracking-[0.2em] opacity-50" style={{ animationDelay: '1s' }}>
          {settings.cover_title}
        </p>
      )}
    </div>
  )
}

import type { CSSProperties, ReactNode } from 'react'
import type { InvitationSettings, SectionBgKey } from '../../lib/invitationTypes'
import { getSectionBackground } from '../../lib/invitationTypes'

type Props = {
  sectionKey: SectionBgKey
  settings: InvitationSettings
  children: ReactNode
  className?: string
}

export function SectionBackgroundShell({
  sectionKey,
  settings,
  children,
  className,
}: Props) {
  const bg = getSectionBackground(settings, sectionKey)
  const url = bg?.image_url?.trim()
  const overlay = bg?.overlay ?? 0.25
  const minHeight =
    typeof bg?.min_height_px === 'number' && bg.min_height_px > 0
      ? bg.min_height_px
      : undefined

  const shellStyle: CSSProperties | undefined = minHeight
    ? {
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }
    : undefined

  if (!url && !minHeight) {
    return <div className={className}>{children}</div>
  }

  if (!url) {
    return (
      <div className={className} style={shellStyle}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={['inv-section-bg-shell', className].filter(Boolean).join(' ')}
      style={shellStyle}
    >
      <img src={url} alt="" className="inv-section-bg-img" draggable={false} />
      {overlay > 0 && (
        <div
          className="inv-section-bg-overlay"
          style={{ opacity: Math.min(overlay, 0.85) }}
        />
      )}
      <div className="inv-section-bg-content">{children}</div>
    </div>
  )
}

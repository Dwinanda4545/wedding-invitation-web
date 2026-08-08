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
  const lineHeight =
    typeof bg?.line_height === 'number' && bg.line_height > 0
      ? bg.line_height
      : undefined

  const shellStyle: CSSProperties = {
    ...(minHeight
      ? {
          minHeight,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }
      : {}),
    ...(lineHeight
      ? ({
          lineHeight,
          ['--inv-section-line-height' as string]: String(lineHeight),
        } as CSSProperties)
      : {}),
  }

  const hasShellStyle = Object.keys(shellStyle).length > 0
  const lineClass = lineHeight ? 'inv-section-line-spaced' : ''

  if (!url && !hasShellStyle) {
    return <div className={className}>{children}</div>
  }

  if (!url) {
    return (
      <div
        className={[className, lineClass].filter(Boolean).join(' ')}
        style={shellStyle}
        data-inv-line-height={lineHeight || undefined}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={['inv-section-bg-shell', className, lineClass]
        .filter(Boolean)
        .join(' ')}
      style={shellStyle}
      data-inv-line-height={lineHeight || undefined}
    >
      <img src={url} alt="" className="inv-section-bg-img" draggable={false} />
      {overlay > 0 && (
        <div
          className="inv-section-bg-overlay"
          style={{ opacity: Math.min(overlay, 0.85) }}
        />
      )}
      <div
        className={['inv-section-bg-content', lineClass].filter(Boolean).join(' ')}
        style={
          lineHeight
            ? ({
                lineHeight,
                ['--inv-section-line-height' as string]: String(lineHeight),
              } as CSSProperties)
            : undefined
        }
        data-inv-line-height={lineHeight || undefined}
      >
        {children}
      </div>
    </div>
  )
}

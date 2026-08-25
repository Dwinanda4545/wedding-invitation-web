import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type {
  InvitationResponse,
  InvitationSettings,
  SectionCustomCode,
} from '../../lib/invitationTypes'
import {
  buildSectionCustomPayload,
  buildSectionCustomSrcdoc,
  resolveSectionCustomVisual,
  SECTION_CUSTOM_SANDBOX,
  type SectionCustomThemeBits,
} from '../../lib/sectionCustom'

type Props = {
  sectionKey: string
  code: SectionCustomCode
  data: InvitationResponse
  theme: SectionCustomThemeBits
  settings?: InvitationSettings
  variant?: 'content' | 'cover'
  isOpen?: boolean
  coverStyle?: CSSProperties
  onOpenCover?: () => void
  onError?: (message: string) => void
  className?: string
  /** Admin editor: jangan pakai position:fixed milik .inv-cover */
  previewEmbed?: boolean
}

type FrameMessage = {
  source?: string
  sectionKey?: string
  type?: string
  height?: number
  message?: string
}

export function CustomSectionFrame({
  sectionKey,
  code,
  data,
  theme,
  settings,
  variant = 'content',
  isOpen = false,
  coverStyle,
  onOpenCover,
  onError,
  className,
  previewEmbed = false,
}: Props) {
  const [height, setHeight] = useState(120)
  const onOpenCoverRef = useRef(onOpenCover)
  const onErrorRef = useRef(onError)
  onOpenCoverRef.current = onOpenCover
  onErrorRef.current = onError

  const payload = useMemo(
    () => buildSectionCustomPayload(data, theme),
    [data, theme],
  )
  const visual = useMemo(
    () => resolveSectionCustomVisual(settings, sectionKey),
    [settings, sectionKey],
  )

  const srcdoc = useMemo(
    () =>
      buildSectionCustomSrcdoc({
        sectionKey,
        html: code.html,
        css: code.css,
        js: code.js,
        libraries: code.libraries,
        payload,
        visual,
        variant,
      }),
    [sectionKey, code.html, code.css, code.js, code.libraries, payload, visual, variant],
  )

  useEffect(() => {
    function onMessage(event: MessageEvent<FrameMessage>) {
      const msg = event.data
      if (!msg || msg.source !== 'inv-section') return
      if (msg.sectionKey !== sectionKey) return
      if (msg.type === 'resize' && typeof msg.height === 'number') {
        setHeight(Math.max(1, Math.ceil(msg.height)))
      }
      if (msg.type === 'open-cover') {
        if (sectionKey === 'cover') onOpenCoverRef.current?.()
      }
      if (msg.type === 'error' && msg.message) {
        onErrorRef.current?.(msg.message)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [sectionKey])

  const minHeight =
    typeof visual?.min_height_px === 'number' && visual.min_height_px > 0
      ? visual.min_height_px
      : undefined
  const lineHeight =
    typeof visual?.line_height === 'number' && visual.line_height > 0
      ? visual.line_height
      : undefined

  const iframe = (
    <iframe
      title={`Section ${sectionKey}`}
      sandbox={SECTION_CUSTOM_SANDBOX}
      srcDoc={srcdoc}
      className="inv-custom-iframe"
      style={
        variant === 'cover'
          ? {
              width: '100%',
              height: '100%',
              border: 0,
              background: 'transparent',
              colorScheme: 'normal',
            }
          : {
              width: '100%',
              height: minHeight ? Math.max(height, minHeight) : height,
              minHeight,
              border: 0,
              display: 'block',
              background: 'transparent',
              colorScheme: 'normal',
            }
      }
    />
  )

  if (variant === 'cover') {
    return (
      <div
        className={[
          previewEmbed ? 'inv-cover-embed' : 'inv-cover',
          !previewEmbed && isOpen ? 'is-open' : '',
          lineHeight ? 'inv-section-line-spaced' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...coverStyle,
          ...(minHeight ? { minHeight } : {}),
          ...(lineHeight
            ? ({
                lineHeight,
                ['--inv-section-line-height' as string]: String(lineHeight),
              } as CSSProperties)
            : {}),
        }}
      >
        {iframe}
      </div>
    )
  }

  return (
    <div
      className={['inv-custom-frame', className].filter(Boolean).join(' ')}
      style={{
        background: 'transparent',
        ...(minHeight ? { minHeight } : {}),
        ...(lineHeight
          ? ({
              lineHeight,
              ['--inv-section-line-height' as string]: String(lineHeight),
            } as CSSProperties)
          : {}),
      }}
    >
      {iframe}
    </div>
  )
}

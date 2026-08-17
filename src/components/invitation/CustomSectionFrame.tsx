import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { InvitationResponse, SectionCustomCode } from '../../lib/invitationTypes'
import {
  buildSectionCustomPayload,
  buildSectionCustomSrcdoc,
  SECTION_CUSTOM_SANDBOX,
  type SectionCustomThemeBits,
} from '../../lib/sectionCustom'

type Props = {
  sectionKey: string
  code: SectionCustomCode
  data: InvitationResponse
  theme: SectionCustomThemeBits
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

  const srcdoc = useMemo(
    () =>
      buildSectionCustomSrcdoc({
        sectionKey,
        html: code.html,
        css: code.css,
        js: code.js,
        libraries: code.libraries,
        payload,
      }),
    [sectionKey, code.html, code.css, code.js, code.libraries, payload],
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

  const iframe = (
    <iframe
      title={`Section ${sectionKey}`}
      sandbox={SECTION_CUSTOM_SANDBOX}
      srcDoc={srcdoc}
      className="inv-custom-iframe"
      style={
        variant === 'cover'
          ? { width: '100%', height: '100%', border: 0 }
          : { width: '100%', height, border: 0, display: 'block' }
      }
    />
  )

  if (variant === 'cover') {
    return (
      <div
        className={[
          previewEmbed ? 'inv-cover-embed' : 'inv-cover',
          !previewEmbed && isOpen ? 'is-open' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={coverStyle}
      >
        {iframe}
      </div>
    )
  }

  return (
    <div className={['inv-custom-frame', className].filter(Boolean).join(' ')}>
      {iframe}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import axios from 'axios'
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
import { api, ensureCsrfCookie } from '../../lib/api'
import type {
  CreateEnvelopeResponse,
  EnvelopePaymentResult,
} from '../../lib/envelopeTypes'

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
  paymentResult?: EnvelopePaymentResult
}

type FrameMessage = {
  source?: string
  sectionKey?: string
  type?: string
  height?: number
  message?: string
  requestId?: string
  payload?: Record<string, unknown>
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
  paymentResult = null,
}: Props) {
  const [height, setHeight] = useState(120)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const onOpenCoverRef = useRef(onOpenCover)
  const onErrorRef = useRef(onError)
  onOpenCoverRef.current = onOpenCover
  onErrorRef.current = onError

  const payload = useMemo(
    () => buildSectionCustomPayload(data, theme, { paymentResult }),
    [data, theme, paymentResult],
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
    function replyCreateEnvelope(
      requestId: string | undefined,
      result: { ok: true; data: unknown } | { ok: false; message: string },
    ) {
      if (!requestId) return
      iframeRef.current?.contentWindow?.postMessage(
        {
          source: 'inv-host',
          requestId,
          type: 'create-envelope-result',
          ...result,
        },
        '*',
      )
    }

    async function handleCreateEnvelope(msg: FrameMessage) {
      const secretToken = data.guest.secret_token
      if (!secretToken) {
        replyCreateEnvelope(msg.requestId, {
          ok: false,
          message: 'Token undangan tidak tersedia.',
        })
        return
      }
      if (previewEmbed) {
        replyCreateEnvelope(msg.requestId, {
          ok: false,
          message: 'Preview admin: pembayaran tidak dijalankan.',
        })
        return
      }

      const body = (msg.payload ?? {}) as {
        sender_name?: string
        sender_email?: string | null
        sender_phone?: string | null
        amount?: number
        message?: string | null
      }

      try {
        await ensureCsrfCookie()
        const { data: res } = await api.post<CreateEnvelopeResponse>(
          `/api/invitation/${secretToken}/digital-envelopes`,
          {
            sender_name: String(body.sender_name ?? data.guest.name ?? '').trim() || data.guest.name,
            sender_email: body.sender_email ?? null,
            sender_phone: body.sender_phone ?? null,
            amount: Number(body.amount ?? 0),
            message: body.message ?? null,
          },
        )
        const paymentUrl = res.data?.payment_url
        // Sandboxed iframe cannot set top.location — navigate from the host.
        if (typeof paymentUrl === 'string' && paymentUrl !== '') {
          window.location.assign(paymentUrl)
          return
        }
        replyCreateEnvelope(msg.requestId, {
          ok: false,
          message: 'payment_url kosong',
        })
      } catch (err) {
        let message = 'Gagal memproses amplop digital.'
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 403) {
            message = 'Amplop digital tidak tersedia untuk undangan ini.'
          } else if (err.response?.status === 422) {
            const errors = err.response.data?.errors as Record<string, string[]> | undefined
            message = (errors ? Object.values(errors).flat()[0] : null) ?? 'Data tidak valid.'
          } else if (err.response?.status === 503) {
            message = 'Layanan pembayaran sedang tidak tersedia. Coba lagi.'
          }
        }
        replyCreateEnvelope(msg.requestId, { ok: false, message })
      }
    }

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
      if (msg.type === 'create-envelope' && sectionKey === 'digital_envelope') {
        void handleCreateEnvelope(msg)
      }
      if (msg.type === 'error' && msg.message) {
        onErrorRef.current?.(msg.message)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [sectionKey, data.guest.secret_token, data.guest.name, previewEmbed])

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
      ref={iframeRef}
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

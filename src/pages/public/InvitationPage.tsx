import axios from 'axios'
import DOMPurify from 'dompurify'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QrSection } from '../../components/invitation/QrSection'
import { SectionInvitation } from '../../components/invitation/SectionInvitation'
import type { InvitationResponse } from '../../lib/invitationTypes'
import {
  parseEnvelopePaymentResult,
  type EnvelopePaymentResult,
} from '../../lib/envelopeTypes'
import {
  getInvitationTheme,
  replaceInvitationVariables,
  themePageStyle,
} from '../../lib/invitationTemplates'
import { api } from '../../lib/api'

export function InvitationPage() {
  const { secret_token } = useParams<{ secret_token: string }>()
  const [data, setData] = useState<InvitationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentResult, setPaymentResult] = useState<EnvelopePaymentResult>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = parseEnvelopePaymentResult(params)
    if (result) {
      setPaymentResult(result)
      const cleanUrl = `${window.location.pathname}`
      window.history.replaceState({}, '', cleanUrl)
    }
  }, [])

  useEffect(() => {
    if (!secret_token) return
    let cancelled = false

    const load = async () => {
      try {
        const res = await api.get<InvitationResponse>(
          `/api/invitation/${secret_token}`,
        )
        if (!cancelled) setData(res.data)
      } catch (e) {
        if (cancelled) return
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setError('Undangan tidak ditemukan.')
        } else {
          setError('Gagal memuat undangan.')
        }
      }
    }

    void load()

    // Refresh while not checked-in so QR hides soon after scan.
    const interval = window.setInterval(() => {
      if (cancelled) return
      void api
        .get<InvitationResponse>(`/api/invitation/${secret_token}`)
        .then((res) => {
          if (cancelled) return
          setData(res.data)
          if (res.data.guest.is_attended) {
            window.clearInterval(interval)
          }
        })
        .catch(() => {
          /* keep current view */
        })
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [secret_token])

  const theme = useMemo(
    () =>
      getInvitationTheme(
        data?.event.invitation_template,
        data?.event.invitation_style,
      ),
    [data?.event.invitation_template, data?.event.invitation_style],
  )

  const bodyHtml = useMemo(() => {
    if (!data) return ''
    const raw =
      data.event.invitation_content?.trim() || theme.defaultContent
    const replaced = replaceInvitationVariables(
      raw,
      {
        guestName: data.guest.name,
        guestType: data.guest.guest_type,
        eventName: data.event.name,
        eventDate: data.event.event_date ?? null,
        eventLocation: data.event.location ?? null,
      },
      theme.style.tagColor,
    )
    return DOMPurify.sanitize(replaced)
  }, [data, theme.defaultContent, theme.style.tagColor])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 px-4 text-center text-white">
        <p>{error}</p>
      </div>
    )
  }

  if (!data || !secret_token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff5f7] text-[#9d174d]">
        Memuat undangan…
      </div>
    )
  }

  const mode = data.event.invitation_mode ?? 'sections'

  if (mode === 'sections') {
    return (
      <SectionInvitation
        data={data}
        secretToken={secret_token}
        paymentResult={paymentResult}
      />
    )
  }

  return (
    <div style={themePageStyle(theme)}>
      <div className="mx-auto flex max-w-lg flex-col px-5 pb-16 pt-12">
        <div
          className="invitation-content"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
        <div className="mt-10">
          <QrSection
            qrCodeUrl={data.guest.qr_code_url}
            isAttended={Boolean(data.guest.is_attended)}
            theme={theme}
          />
        </div>
      </div>
    </div>
  )
}

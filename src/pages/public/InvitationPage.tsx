import axios from 'axios'
import DOMPurify from 'dompurify'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SectionInvitation } from '../../components/invitation/SectionInvitation'
import type { InvitationResponse } from '../../lib/invitationTypes'
import {
  getInvitationTheme,
  replaceInvitationVariables,
  themePageStyle,
  themeQrCardStyle,
} from '../../lib/invitationTemplates'
import { api } from '../../lib/api'

export function InvitationPage() {
  const { secret_token } = useParams<{ secret_token: string }>()
  const [data, setData] = useState<InvitationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!secret_token) return
    let cancelled = false
    void api
      .get<InvitationResponse>(`/api/invitation/${secret_token}`)
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch((e) => {
        if (cancelled) return
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setError('Undangan tidak ditemukan.')
        } else {
          setError('Gagal memuat undangan.')
        }
      })
    return () => {
      cancelled = true
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
        <div className="mt-10" style={themeQrCardStyle(theme)}>
          <div className="mx-auto max-w-[220px] rounded-2xl bg-white p-4 shadow-inner">
            {data.guest.qr_code_url ? (
              <img
                src={data.guest.qr_code_url}
                alt="QR tamu"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-center text-xs text-stone-500">
                QR tidak tersedia
              </div>
            )}
          </div>
          <p
            className="mt-4 text-center text-xs leading-relaxed"
            style={{ color: theme.style.qrHintColor }}
          >
            Tunjukkan QR ini di meja resepsi untuk check-in.
          </p>
        </div>
      </div>
    </div>
  )
}

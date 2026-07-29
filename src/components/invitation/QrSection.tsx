import type { InvitationTheme } from '../../lib/invitationTemplates'
import { themeQrCardStyle } from '../../lib/invitationTemplates'

type Props = {
  qrCodeUrl?: string | null
  isAttended?: boolean
  theme: InvitationTheme
}

export function QrSection({ qrCodeUrl, isAttended = false, theme }: Props) {
  return (
    <section className="inv-section inv-animate-fade-up">
      <div style={themeQrCardStyle(theme)}>
        {isAttended ? (
          <div className="mx-auto flex max-w-[280px] flex-col items-center rounded-2xl bg-white px-5 py-8 text-center shadow-inner">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
              ✓
            </div>
            <p className="mt-4 text-base font-semibold text-stone-900">
              Sudah Terdaftar ke Buku Tamu
            </p>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              Kehadiran Anda sudah tercatat. QR check-in tidak lagi ditampilkan.
            </p>
          </div>
        ) : (
          <>
            <div className="mx-auto max-w-[220px] rounded-2xl bg-white p-4 shadow-inner">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
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
          </>
        )}
      </div>
    </section>
  )
}

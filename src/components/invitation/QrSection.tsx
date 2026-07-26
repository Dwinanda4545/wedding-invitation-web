import type { InvitationTheme } from '../../lib/invitationTemplates'
import { themeQrCardStyle } from '../../lib/invitationTemplates'

type Props = {
  qrCodeUrl?: string | null
  theme: InvitationTheme
}

export function QrSection({ qrCodeUrl, theme }: Props) {
  return (
    <section className="inv-section inv-animate-fade-up">
      <div style={themeQrCardStyle(theme)}>
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
      </div>
    </section>
  )
}

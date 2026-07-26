export type ThemeStyle = {
  pageBackground: string
  pageTextColor: string
  tagColor: string
  qrCardBackground: string
  qrCardBorder: string
  qrHintColor: string
  fontFamily: string
  fontSize: string
  fontWeight: string
  textAlign: 'left' | 'center' | 'right'
  letterSpacing: string
}

export type InvitationTheme = {
  id: string
  label: string
  description: string
  style: ThemeStyle
  defaultContent: string
  isCustom?: boolean
}

export type ApiInvitationThemeRow = {
  id: number
  name: string
  description: string | null
  style: ThemeStyle
  default_content: string | null
}

export const GENERIC_DEFAULT_CONTENT = `<p style="text-align:center;font-size:12px;letter-spacing:0.3em;text-transform:uppercase">Undangan</p>
<h1 style="text-align:center;font-family:serif;font-size:2rem">{{nama_acara}}</h1>
<p style="text-align:center">{{tanggal}}</p>
<p style="text-align:center">{{lokasi}}</p>
<p style="text-align:center;margin-top:2rem">Kepada Yth.</p>
<h2 style="text-align:center;font-family:serif;font-size:1.5rem">{{nama_tamu}}</h2>
<p style="text-align:center">{{tipe_tamu}}</p>
<p style="text-align:center;margin-top:2rem;font-style:italic">Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir.</p>`

export const BUILTIN_TEMPLATES: InvitationTheme[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Nuansa hangat coklat dan emas',
    style: {
      pageBackground: 'linear-gradient(to bottom, #2c1810, #1a1512, #0f0c0a)',
      pageTextColor: '#f5e9dc',
      tagColor: '#c9a66b',
      qrCardBackground: 'rgba(35, 24, 21, 0.8)',
      qrCardBorder: '#3d2e26',
      qrHintColor: '#8a7b6c',
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontSize: '16px',
      fontWeight: '400',
      textAlign: 'center',
      letterSpacing: 'normal',
    },
    defaultContent: `<p style="text-align:center;color:#c9a66b;font-size:12px;letter-spacing:0.3em;text-transform:uppercase">Undangan</p>
<h1 style="text-align:center;font-family:serif;color:#fdf6eb;font-size:2rem">{{nama_acara}}</h1>
<p style="text-align:center;color:#d4c4b0">{{tanggal}}</p>
<p style="text-align:center;color:#bfa985">{{lokasi}}</p>
<p style="text-align:center;margin-top:2rem;color:#c9a66b">Kepada Yth.</p>
<h2 style="text-align:center;font-family:serif;color:#fff8ee;font-size:1.5rem">{{nama_tamu}}</h2>
<p style="text-align:center;color:#9c8b78">{{tipe_tamu}}</p>
<p style="text-align:center;margin-top:2rem;font-style:italic;color:#c9a66b">Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir.</p>`,
  },
  {
    id: 'elegant',
    label: 'Elegant',
    description: 'Putih krem dengan aksen hitam',
    style: {
      pageBackground: '#faf8f5',
      pageTextColor: '#1c1917',
      tagColor: '#92400e',
      qrCardBackground: '#ffffff',
      qrCardBorder: '#e7e5e4',
      qrHintColor: '#78716c',
      fontFamily: "'Palatino Linotype', 'Book Antiqua', serif",
      fontSize: '16px',
      fontWeight: '400',
      textAlign: 'center',
      letterSpacing: '0.02em',
    },
    defaultContent: `<p style="text-align:center;color:#78716c;font-size:11px;letter-spacing:0.4em;text-transform:uppercase">The Wedding of</p>
<h1 style="text-align:center;font-family:serif;font-weight:400;color:#1c1917;font-size:2rem">{{nama_acara}}</h1>
<hr style="width:80px;margin:1.5rem auto;border:none;border-top:1px solid #d6d3d1" />
<p style="text-align:center;color:#57534e">{{tanggal}} · {{lokasi}}</p>
<p style="text-align:center;margin-top:2.5rem;color:#78716c">Dear</p>
<h2 style="text-align:center;font-family:serif;font-weight:600;font-size:1.5rem">{{nama_tamu}}</h2>
<p style="text-align:center;color:#a8a29e">{{tipe_tamu}}</p>`,
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Bersih, minimal, aksen rose',
    style: {
      pageBackground: '#ffffff',
      pageTextColor: '#292524',
      tagColor: '#be123c',
      qrCardBackground: 'rgba(255, 241, 242, 0.5)',
      qrCardBorder: '#fecdd3',
      qrHintColor: '#78716c',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontWeight: '500',
      textAlign: 'center',
      letterSpacing: 'normal',
    },
    defaultContent: `<h1 style="text-align:center;font-size:2rem;font-weight:700;color:#be123c">{{nama_acara}}</h1>
<p style="text-align:center;color:#78716c;margin-top:0.5rem">{{tanggal}}</p>
<p style="text-align:center;color:#78716c">{{lokasi}}</p>
<div style="margin-top:2rem;padding:1.5rem;border-radius:1rem;background:#fff1f2;text-align:center">
  <p style="font-size:0.75rem;color:#be123c;text-transform:uppercase;letter-spacing:0.1em">Tamu undangan</p>
  <p style="font-size:1.5rem;font-weight:600;margin-top:0.5rem">{{nama_tamu}}</p>
  <p style="font-size:0.875rem;color:#78716c">{{tipe_tamu}}</p>
</div>`,
  },
  {
    id: 'cherry-blossom',
    label: 'Cherry Blossom',
    description: 'Nuansa sakura pink romantis ala Kadio',
    style: {
      pageBackground: 'linear-gradient(180deg, #fff5f7 0%, #fce7f3 50%, #fdf2f8 100%)',
      pageTextColor: '#500724',
      tagColor: '#be185d',
      qrCardBackground: 'rgba(255, 255, 255, 0.85)',
      qrCardBorder: '#fbcfe8',
      qrHintColor: '#9d174d',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: '16px',
      fontWeight: '400',
      textAlign: 'center',
      letterSpacing: '0.02em',
    },
    defaultContent: GENERIC_DEFAULT_CONTENT,
  },
]

export const DEFAULT_CUSTOM_STYLE: ThemeStyle = {
  pageBackground: '#1e3a5f',
  pageTextColor: '#f0f9ff',
  tagColor: '#7dd3fc',
  qrCardBackground: 'rgba(255, 255, 255, 0.12)',
  qrCardBorder: '#93c5fd',
  qrHintColor: '#bfdbfe',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '16px',
  fontWeight: '400',
  textAlign: 'center',
  letterSpacing: 'normal',
}

export function mergeThemeStyle(partial: Partial<ThemeStyle>): ThemeStyle {
  return { ...DEFAULT_CUSTOM_STYLE, ...partial }
}

export function customThemeFromApi(row: ApiInvitationThemeRow): InvitationTheme {
  return {
    id: `custom-${row.id}`,
    label: row.name,
    description: row.description ?? '',
    style: mergeThemeStyle(row.style),
    defaultContent: row.default_content ?? GENERIC_DEFAULT_CONTENT,
    isCustom: true,
  }
}

export function getInvitationTheme(
  templateId?: string | null,
  styleOverride?: Record<string, unknown> | null,
  customThemes: InvitationTheme[] = [],
): InvitationTheme {
  if (
    styleOverride &&
    typeof styleOverride.pageBackground === 'string' &&
    typeof styleOverride.pageTextColor === 'string'
  ) {
    return {
      id: (styleOverride.theme as string) ?? templateId ?? 'custom',
      label: (styleOverride.label as string) ?? 'Custom',
      description: '',
      style: mergeThemeStyle({
        pageBackground: styleOverride.pageBackground as string,
        pageTextColor: styleOverride.pageTextColor as string,
        tagColor: styleOverride.tagColor as string | undefined,
        qrCardBackground: styleOverride.qrCardBackground as string | undefined,
        qrCardBorder: styleOverride.qrCardBorder as string | undefined,
        qrHintColor: styleOverride.qrHintColor as string | undefined,
        fontFamily: styleOverride.fontFamily as string | undefined,
        fontSize: styleOverride.fontSize as string | undefined,
        fontWeight: styleOverride.fontWeight as string | undefined,
        textAlign: styleOverride.textAlign as ThemeStyle['textAlign'] | undefined,
        letterSpacing: styleOverride.letterSpacing as string | undefined,
      }),
      defaultContent: GENERIC_DEFAULT_CONTENT,
    }
  }

  if (templateId?.startsWith('custom-')) {
    const found = customThemes.find((t) => t.id === templateId)
    if (found) return found
  }

  return (
    BUILTIN_TEMPLATES.find((t) => t.id === templateId) ?? BUILTIN_TEMPLATES[0]
  )
}

export function themeToStylePayload(theme: InvitationTheme) {
  return {
    theme: theme.id,
    label: theme.label,
    ...theme.style,
  }
}

export function themePageStyle(theme: InvitationTheme) {
  return {
    minHeight: '100vh',
    background: theme.style.pageBackground,
    color: theme.style.pageTextColor,
    fontFamily: theme.style.fontFamily,
    fontSize: theme.style.fontSize,
    fontWeight: theme.style.fontWeight,
    textAlign: theme.style.textAlign,
    letterSpacing: theme.style.letterSpacing,
  }
}

export function themeQrCardStyle(theme: InvitationTheme) {
  return {
    borderRadius: '1.5rem',
    border: `1px solid ${theme.style.qrCardBorder}`,
    background: theme.style.qrCardBackground,
    padding: '2rem',
  }
}

type ReplaceInput = {
  guestName: string
  guestType: string
  eventName: string
  eventDate: string | null
  eventLocation: string | null
}

export function replaceInvitationVariables(
  html: string,
  input: ReplaceInput,
  tagColor?: string,
): string {
  const when = input.eventDate
    ? new Date(input.eventDate).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  const guestTypeLabel =
    input.guestType === 'VIP' ? 'Tamu VIP' : 'Tamu'

  const wrap = (value: string) =>
    tagColor ? `<span style="color:${tagColor}">${value}</span>` : value

  return html
    .replaceAll('{{nama_tamu}}', wrap(input.guestName))
    .replaceAll('{{tipe_tamu}}', wrap(guestTypeLabel))
    .replaceAll('{{nama_acara}}', wrap(input.eventName))
    .replaceAll('{{tanggal}}', wrap(when))
    .replaceAll('{{lokasi}}', wrap(input.eventLocation ?? '—'))
}

// Backward compatibility
export const INVITATION_TEMPLATES = BUILTIN_TEMPLATES

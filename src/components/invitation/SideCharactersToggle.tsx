type Props = {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

/** Guest session toggle for side characters (does not persist). */
export function SideCharactersToggle({ enabled, onChange }: Props) {
  return (
    <button
      type="button"
      className={['inv-chars-toggle', enabled ? 'is-on' : ''].join(' ')}
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? 'Matikan karakter sisi' : 'Nyalakan karakter sisi'}
      title={enabled ? 'Matikan karakter sisi' : 'Nyalakan karakter sisi'}
    >
      <span className="inv-chars-toggle-icon" aria-hidden>
        ✦
      </span>
    </button>
  )
}

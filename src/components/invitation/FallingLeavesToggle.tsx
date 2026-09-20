type Props = {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

/** Guest session toggle for falling leaves (does not persist). */
export function FallingLeavesToggle({ enabled, onChange }: Props) {
  return (
    <button
      type="button"
      className={['inv-leaves-toggle', enabled ? 'is-on' : ''].join(' ')}
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? 'Matikan daun jatuh' : 'Nyalakan daun jatuh'}
      title={enabled ? 'Matikan daun jatuh' : 'Nyalakan daun jatuh'}
    >
      <span className="inv-leaves-toggle-icon" aria-hidden>
        🍃
      </span>
    </button>
  )
}

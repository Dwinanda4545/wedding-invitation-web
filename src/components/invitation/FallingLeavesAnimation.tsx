const LEAF_COUNT = 16

type Props = {
  /** Invitation accent — leaves tint toward this color */
  tagColor?: string
  /** Admin preview sits inside scaled frames; use absolute fill instead of fixed */
  previewEmbed?: boolean
}

/**
 * Falling leaves overlay inspired by https://codepen.io/uurrnn/pen/WNLVdN
 * Colors follow invitation tagColor.
 */
export function FallingLeavesAnimation({
  tagColor = '#be185d',
  previewEmbed = false,
}: Props) {
  return (
    <div
      className={['falling-leaves', previewEmbed ? 'is-preview-embed' : '']
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
      style={{ ['--inv-leaf' as string]: tagColor }}
    >
      {Array.from({ length: LEAF_COUNT }).map((_, i) => (
        <i
          key={i}
          className={['falling-leaf', i % 2 === 1 ? 'is-rev' : '']
            .filter(Boolean)
            .join(' ')}
          style={{
            left: `${(i * 6.3 + 2) % 98}%`,
            animationDuration: `${8 + (i % 6)}s`,
            animationDelay: `${-((i * 0.9) % 10)}s`,
            ['--leaf-size' as string]: `${18 + (i % 5) * 4}px`,
            ['--leaf-sway' as string]: `${28 + (i % 4) * 14}px`,
            opacity: 0.65 + (i % 4) * 0.08,
            filter:
              i % 3 === 0
                ? 'brightness(1.2) saturate(1.15)'
                : i % 3 === 1
                  ? 'brightness(0.9)'
                  : undefined,
          }}
        />
      ))}
    </div>
  )
}

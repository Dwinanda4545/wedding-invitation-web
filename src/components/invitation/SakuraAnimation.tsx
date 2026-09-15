const PETAL_COUNT = 10

/** Lightweight sakura petals — mount only after cover open (parent-gated). */
export function SakuraAnimation() {
  return (
    <div className="sakura-container" aria-hidden="true">
      {Array.from({ length: PETAL_COUNT }).map((_, i) => (
        <span
          key={i}
          className="sakura-petal"
          style={{
            left: `${(i * 37) % 100}%`,
            animationDuration: `${9 + (i % 5)}s`,
            animationDelay: `${(i * 0.85) % 6}s`,
            width: `${8 + (i % 3) * 2}px`,
            height: `${8 + (i % 3) * 2}px`,
          }}
        />
      ))}
    </div>
  )
}

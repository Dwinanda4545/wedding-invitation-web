const PETAL_COUNT = 18

export function SakuraAnimation() {
  return (
    <div className="sakura-container" aria-hidden="true">
      {Array.from({ length: PETAL_COUNT }).map((_, i) => (
        <span
          key={i}
          className="sakura-petal"
          style={{
            left: `${(i * 37) % 100}%`,
            animationDuration: `${8 + (i % 6)}s`,
            animationDelay: `${(i * 0.7) % 5}s`,
            width: `${8 + (i % 4) * 2}px`,
            height: `${8 + (i % 4) * 2}px`,
          }}
        />
      ))}
    </div>
  )
}

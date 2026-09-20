import { useEffect, useRef } from 'react'
import { Lottie, type LottieHandle } from 'lottie-react'
import sideCharacter from '../../assets/lottie/side-character.json'

type Props = {
  /** Admin preview sits inside scaled frames; use absolute fill instead of fixed */
  previewEmbed?: boolean
}

/**
 * Fixed left/right idle Lottie characters (mirrored on the right).
 */
export function SideCharacters({ previewEmbed = false }: Props) {
  const leftRef = useRef<LottieHandle>(null)
  const rightRef = useRef<LottieHandle>(null)

  useEffect(() => {
    const sync = () => {
      const hidden = document.visibilityState === 'hidden'
      for (const ref of [leftRef, rightRef]) {
        if (hidden) ref.current?.pause()
        else ref.current?.play()
      }
    }
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  return (
    <div
      className={['side-characters', previewEmbed ? 'is-preview-embed' : '']
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <div className="side-characters-slot is-left">
        <Lottie
          lottieRef={leftRef}
          src={sideCharacter}
          loop
          autoplay
          className="side-characters-anim"
        />
      </div>
      <div className="side-characters-slot is-right">
        <Lottie
          lottieRef={rightRef}
          src={sideCharacter}
          loop
          autoplay
          className="side-characters-anim"
        />
      </div>
    </div>
  )
}

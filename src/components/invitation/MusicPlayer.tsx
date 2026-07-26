import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

export type MusicPlayerHandle = {
  play: () => void
}

type Props = {
  url?: string
  enabled?: boolean
  defaultVolume?: number
}

export const MusicPlayer = forwardRef<MusicPlayerHandle, Props>(
  function MusicPlayer({ url, enabled, defaultVolume = 0.6 }, ref) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)
    const [showSlider, setShowSlider] = useState(false)
    const [volume, setVolume] = useState(defaultVolume)

    useImperativeHandle(ref, () => ({
      play: () => {
        const audio = audioRef.current
        if (!audio) return
        void audio
          .play()
          .then(() => setPlaying(true))
          .catch(() => {
            // Autoplay masih bisa ditolak browser; tamu bisa pakai tombol manual.
          })
      },
    }))

    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.volume = volume
      }
    }, [volume])

    if (!enabled || !url) return null

    function toggle() {
      const audio = audioRef.current
      if (!audio) return
      if (audio.paused) {
        void audio.play().then(() => setPlaying(true)).catch(() => {})
      } else {
        audio.pause()
        setPlaying(false)
      }
    }

    return (
      <div
        className="inv-music-control"
        onMouseEnter={() => setShowSlider(true)}
        onMouseLeave={() => setShowSlider(false)}
      >
        <audio
          ref={audioRef}
          src={url}
          loop
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {showSlider && (
          <div className="inv-music-slider">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume musik"
            />
          </div>
        )}

        <button
          type="button"
          className={['inv-music-btn', playing ? 'is-playing' : ''].join(' ')}
          onClick={toggle}
          onTouchStart={() => setShowSlider((s) => !s)}
          aria-label={playing ? 'Jeda musik' : 'Putar musik'}
        >
          {playing ? '⏸' : '♪'}
        </button>
      </div>
    )
  },
)

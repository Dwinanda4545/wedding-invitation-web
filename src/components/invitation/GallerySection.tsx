import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Splide, SplideSlide } from '@splidejs/react-splide'
import type { Options, Splide as SplideCore } from '@splidejs/splide'
import '@splidejs/react-splide/css/core'
import type {
  GalleryImage,
  GallerySliderSettings,
} from '../../lib/invitationTypes'
import { mergeGallerySlider } from '../../lib/invitationTypes'
import { SectionTitle } from './SectionTitle'

type Props = {
  images: GalleryImage[]
  tagColor?: string
  title?: string
  showTitle?: boolean
  sliderSettings?: GallerySliderSettings | null
  /** When false, keep a light placeholder until parent is ready (after cover open). */
  enabled?: boolean
}

type SplideComponent = InstanceType<typeof Splide>

export function GallerySection({
  images,
  tagColor,
  title = 'Galeri',
  showTitle = true,
  sliderSettings,
  enabled = true,
}: Props) {
  const slider = mergeGallerySlider(sliderSettings)
  const rootRef = useRef<HTMLElement>(null)
  const splideRef = useRef<SplideComponent | null>(null)
  const [nearViewport, setNearViewport] = useState(false)
  const [inView, setInView] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [readyIds, setReadyIds] = useState<Set<number>>(() => new Set())

  const mobileHeightPx = Math.max(200, Math.round(slider.height_px * 0.72))

  useEffect(() => {
    setReadyIds(new Set())
    setActiveIndex(0)
  }, [images])

  useEffect(() => {
    if (!enabled) {
      setNearViewport(false)
      setInView(false)
      return
    }
    const el = rootRef.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          setNearViewport(true)
          setInView(true)
        } else {
          setInView(false)
        }
      },
      { rootMargin: '120px 0px', threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [enabled])

  // Stable options — no inView (avoids remount). No focus:'center' (breaks loop + perPage 1).
  const options = useMemo<Options>(
    () => ({
      type: slider.type,
      rewind: slider.rewind,
      autoplay: slider.autoplay,
      interval: slider.interval_ms,
      pauseOnHover: slider.pause_on_hover,
      arrows: slider.arrows,
      pagination: false,
      perPage: slider.type === 'fade' ? 1 : slider.per_page,
      gap: `${slider.gap_px}px`,
      height: `${slider.height_px}px`,
      cover: true,
      speed: 500,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      breakpoints: {
        640: {
          perPage: 1,
          gap: `${Math.min(slider.gap_px, 8)}px`,
          height: `${mobileHeightPx}px`,
        },
      },
    }),
    [slider, mobileHeightPx],
  )

  const syncAutoplay = useCallback(() => {
    const splide = splideRef.current?.splide
    if (!splide) return
    const autoplay = splide.Components.Autoplay
    if (!autoplay) return
    if (slider.autoplay && inView) {
      autoplay.play()
    } else {
      autoplay.pause()
    }
  }, [inView, slider.autoplay])

  useEffect(() => {
    syncAutoplay()
  }, [syncAutoplay])

  const settleLayout = useCallback(() => {
    const splide = splideRef.current?.splide
    if (!splide) return
    splide.refresh()
    // Re-apply integer index without fighting mid-drag transforms.
    const idx = Math.round(splide.index)
    if (Number.isFinite(idx)) {
      splide.go(idx)
    }
  }, [])

  useEffect(() => {
    if (!nearViewport || !enabled) return

    let timer: number | null = null
    const onResize = () => {
      if (timer != null) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        settleLayout()
      }, 150)
    }

    window.addEventListener('resize', onResize)
    return () => {
      if (timer != null) window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [nearViewport, enabled, settleLayout])

  const markReady = useCallback((id: number) => {
    setReadyIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const imagesReady = useMemo(() => {
    if (images.length === 0) return true
    const indices = [activeIndex - 1, activeIndex, activeIndex + 1].filter(
      (i) => i >= 0 && i < images.length,
    )
    // Always require the active slide; neighbors optional if missing.
    return indices.every((i) => readyIds.has(images[i]!.id))
  }, [images, activeIndex, readyIds])

  // After images paint, refresh once so track width/position is correct on mobile.
  useEffect(() => {
    if (!imagesReady || !nearViewport) return
    const id = window.setTimeout(() => {
      settleLayout()
      syncAutoplay()
    }, 50)
    return () => window.clearTimeout(id)
  }, [imagesReady, nearViewport, settleLayout, syncAutoplay])

  const onMounted = useCallback(
    (splide: SplideCore) => {
      window.setTimeout(() => {
        splide.refresh()
        syncAutoplay()
      }, 0)
    },
    [syncAutoplay],
  )

  const onMoved = useCallback((splide: SplideCore) => {
    setActiveIndex(Math.round(splide.index))
  }, [])

  if (images.length === 0) return null

  return (
    <section ref={rootRef} className="inv-section inv-animate-fade-up">
      <SectionTitle title={title} show={showTitle} tagColor={tagColor} />
      <div
        className="inv-gallery-splide mx-auto w-full max-w-lg px-2"
        data-theme={slider.theme}
        data-ready={imagesReady ? 'true' : 'false'}
        style={
          {
            '--inv-gallery-accent': tagColor ?? '#be185d',
            '--inv-gallery-h': `${slider.height_px}px`,
            '--inv-gallery-h-mobile': `${mobileHeightPx}px`,
          } as CSSProperties
        }
      >
        {enabled && nearViewport ? (
          <>
            <div
              className="inv-gallery-loading"
              data-ready={imagesReady ? 'true' : 'false'}
              aria-hidden={imagesReady}
              aria-busy={!imagesReady}
            >
              <span className="inv-gallery-spinner" />
              <span className="inv-sr-only">Memuat galeri…</span>
            </div>
            <Splide
              ref={splideRef}
              options={options}
              aria-label={title}
              onMounted={onMounted}
              onMoved={onMoved}
            >
              {images.map((img, index) => (
                <SplideSlide key={img.id}>
                  <figure className="inv-gallery-slide">
                    <img
                      src={img.image_url}
                      alt={img.caption ?? 'Galeri'}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={index === 0 ? 'high' : 'low'}
                      ref={(el) => {
                        if (el?.complete) markReady(img.id)
                      }}
                      onLoad={() => markReady(img.id)}
                      onError={() => markReady(img.id)}
                    />
                    {img.caption?.trim() && (
                      <figcaption>{img.caption}</figcaption>
                    )}
                  </figure>
                </SplideSlide>
              ))}
            </Splide>
          </>
        ) : (
          <div className="inv-gallery-placeholder" aria-hidden>
            <span className="inv-gallery-spinner" />
          </div>
        )}
      </div>
    </section>
  )
}

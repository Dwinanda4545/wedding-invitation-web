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

function snapToNearestSlide(splide: SplideCore) {
  const idx = splide.index
  if (!Number.isFinite(idx)) return
  const nearest = Math.round(idx)
  if (nearest !== idx) {
    splide.go(nearest)
  }
}

function refreshAndSnap(splide: SplideCore) {
  splide.refresh()
  snapToNearestSlide(splide)
}

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
      focus: 'center',
      trimSpace: 'move',
      updateOnMove: true,
      speed: 500,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      breakpoints: {
        640: {
          perPage: 1,
          gap: `${Math.min(slider.gap_px, 8)}px`,
          height: undefined,
          heightRatio: 1.25,
          focus: 'center',
          trimSpace: 'move',
          arrows: slider.arrows,
        },
      },
    }),
    [slider],
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

  useEffect(() => {
    if (!nearViewport || !enabled) return

    const onResize = () => {
      const splide = splideRef.current?.splide
      if (!splide) return
      refreshAndSnap(splide)
    }

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      onResize()
      syncAutoplay()
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [nearViewport, enabled, syncAutoplay])

  useEffect(() => {
    if (!inView) return
    const splide = splideRef.current?.splide
    if (!splide) return
    // Recalculate after becoming visible (cover open / scroll into view).
    const id = window.requestAnimationFrame(() => {
      refreshAndSnap(splide)
      syncAutoplay()
    })
    return () => window.cancelAnimationFrame(id)
  }, [inView, syncAutoplay])

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
    return indices.every((i) => readyIds.has(images[i]!.id))
  }, [images, activeIndex, readyIds])

  const onMounted = useCallback(
    (splide: SplideCore) => {
      window.requestAnimationFrame(() => {
        refreshAndSnap(splide)
        syncAutoplay()
      })
    },
    [syncAutoplay],
  )

  const onMoved = useCallback((splide: SplideCore) => {
    setActiveIndex(splide.index)
    snapToNearestSlide(splide)
  }, [])

  const onResized = useCallback((splide: SplideCore) => {
    snapToNearestSlide(splide)
  }, [])

  if (images.length === 0) return null

  return (
    <section ref={rootRef} className="inv-section inv-animate-fade-up">
      <SectionTitle title={title} show={showTitle} tagColor={tagColor} />
      <div
        className="inv-gallery-splide mx-auto max-w-lg px-2"
        data-theme={slider.theme}
        data-ready={imagesReady ? 'true' : 'false'}
        style={
          {
            '--inv-gallery-accent': tagColor ?? '#be185d',
            '--inv-gallery-h': `${slider.height_px}px`,
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
              onResized={onResized}
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
          <div
            className="inv-gallery-placeholder"
            style={{ height: `${slider.height_px}px` }}
            aria-hidden
          >
            <span className="inv-gallery-spinner" />
          </div>
        )}
      </div>
    </section>
  )
}

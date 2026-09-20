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
  /**
   * Invitation mobile canvas uses CSS scale — Splide breaks there.
   * Use a simple one-image viewer with prev/next + dots instead.
   */
  simpleControls?: boolean
}

type SplideComponent = InstanceType<typeof Splide>

function wrapIndex(index: number, length: number) {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

export function GallerySection({
  images,
  tagColor,
  title = 'Galeri',
  showTitle = true,
  sliderSettings,
  enabled = true,
  simpleControls = false,
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

  // Desktop Splide only — no mobile breakpoints (scaled canvas breaks Splide).
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
      drag: true,
      waitForTransition: false,
      speed: 450,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }),
    [slider],
  )

  const syncAutoplay = useCallback(() => {
    if (simpleControls) return
    const splide = splideRef.current?.splide
    if (!splide) return
    const autoplay = splide.Components.Autoplay
    if (!autoplay) return
    if (slider.autoplay && inView) {
      autoplay.play()
    } else {
      autoplay.pause()
    }
  }, [inView, slider.autoplay, simpleControls])

  useEffect(() => {
    syncAutoplay()
  }, [syncAutoplay])

  // Simple mobile gallery autoplay (no Splide).
  useEffect(() => {
    if (!simpleControls || !slider.autoplay || !inView || images.length < 2) {
      return
    }
    const id = window.setInterval(() => {
      setActiveIndex((i) => wrapIndex(i + 1, images.length))
    }, slider.interval_ms)
    return () => window.clearInterval(id)
  }, [
    simpleControls,
    slider.autoplay,
    slider.interval_ms,
    inView,
    images.length,
  ])

  const settleLayout = useCallback(() => {
    if (simpleControls) return
    const splide = splideRef.current?.splide
    if (!splide) return
    splide.refresh()
    const idx = Math.round(splide.index)
    if (Number.isFinite(idx)) {
      splide.go(idx)
    }
  }, [simpleControls])

  const didInitialSettleRef = useRef(false)

  useEffect(() => {
    didInitialSettleRef.current = false
  }, [images])

  useEffect(() => {
    if (simpleControls || !nearViewport || !enabled) return

    let timer: number | null = null
    const onResize = () => {
      if (timer != null) window.clearTimeout(timer)
      timer = window.setTimeout(() => settleLayout(), 150)
    }

    window.addEventListener('resize', onResize)
    return () => {
      if (timer != null) window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [nearViewport, enabled, settleLayout, simpleControls])

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
    const active = images[activeIndex] ?? images[0]
    return active ? readyIds.has(active.id) : true
  }, [images, activeIndex, readyIds])

  useEffect(() => {
    if (simpleControls || !imagesReady || !nearViewport || didInitialSettleRef.current) {
      return
    }
    didInitialSettleRef.current = true
    const id = window.setTimeout(() => {
      settleLayout()
      syncAutoplay()
    }, 50)
    return () => window.clearTimeout(id)
  }, [imagesReady, nearViewport, settleLayout, syncAutoplay, simpleControls])

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

  const goPrev = useCallback(() => {
    setActiveIndex((i) => wrapIndex(i - 1, images.length))
  }, [images.length])

  const goNext = useCallback(() => {
    setActiveIndex((i) => wrapIndex(i + 1, images.length))
  }, [images.length])

  if (images.length === 0) return null

  const active = images[activeIndex] ?? images[0]!

  return (
    <section ref={rootRef} className="inv-section inv-animate-fade-up">
      <SectionTitle title={title} show={showTitle} tagColor={tagColor} />
      <div
        className={[
          'inv-gallery-splide',
          'mx-auto',
          'w-full',
          'max-w-lg',
          'px-2',
          simpleControls ? 'is-simple' : '',
        ]
          .filter(Boolean)
          .join(' ')}
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
          simpleControls ? (
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
              <div
                className="inv-gallery-simple"
                style={{ height: `${slider.height_px}px` }}
                aria-roledescription="carousel"
                aria-label={title}
              >
                <figure className="inv-gallery-slide">
                  <img
                    key={active.id}
                    src={active.image_url}
                    alt={active.caption ?? 'Galeri'}
                    draggable={false}
                    decoding="async"
                    fetchPriority="high"
                    ref={(el) => {
                      if (el?.complete) markReady(active.id)
                    }}
                    onLoad={() => markReady(active.id)}
                    onError={() => markReady(active.id)}
                  />
                  {active.caption?.trim() && (
                    <figcaption>{active.caption}</figcaption>
                  )}
                </figure>

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="inv-gallery-nav is-prev"
                      aria-label="Foto sebelumnya"
                      onClick={goPrev}
                    >
                      <span aria-hidden="true">‹</span>
                    </button>
                    <button
                      type="button"
                      className="inv-gallery-nav is-next"
                      aria-label="Foto berikutnya"
                      onClick={goNext}
                    >
                      <span aria-hidden="true">›</span>
                    </button>
                    <div className="inv-gallery-dots" role="tablist" aria-label="Pilih foto">
                      {images.map((img, i) => (
                        <button
                          key={img.id}
                          type="button"
                          role="tab"
                          aria-selected={i === activeIndex}
                          aria-label={`Foto ${i + 1}`}
                          className={
                            i === activeIndex
                              ? 'inv-gallery-dot is-active'
                              : 'inv-gallery-dot'
                          }
                          onClick={() => setActiveIndex(i)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
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
                        draggable={false}
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
          )
        ) : (
          <div className="inv-gallery-placeholder" aria-hidden>
            <span className="inv-gallery-spinner" />
          </div>
        )}
      </div>
    </section>
  )
}

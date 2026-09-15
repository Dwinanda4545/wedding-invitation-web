import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Splide, SplideSlide } from '@splidejs/react-splide'
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
  const [nearViewport, setNearViewport] = useState(false)
  const [inView, setInView] = useState(false)

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

  const options = useMemo(
    () => ({
      type: slider.type,
      rewind: slider.rewind,
      // Only autoplay while the gallery is on screen.
      autoplay: slider.autoplay && inView,
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
          perPage: slider.type === 'fade' ? 1 : Math.min(slider.per_page, 2),
          height: `${Math.round(slider.height_px * 0.85)}px`,
        },
      },
    }),
    [slider, inView],
  )

  if (images.length === 0) return null

  return (
    <section ref={rootRef} className="inv-section inv-animate-fade-up">
      <SectionTitle title={title} show={showTitle} tagColor={tagColor} />
      <div
        className="inv-gallery-splide mx-auto max-w-lg px-2"
        data-theme={slider.theme}
        style={
          {
            '--inv-gallery-accent': tagColor ?? '#be185d',
            minHeight: `${slider.height_px}px`,
          } as CSSProperties
        }
      >
        {enabled && nearViewport ? (
          <Splide options={options} aria-label={title}>
            {images.map((img, index) => (
              <SplideSlide key={img.id}>
                <figure className="inv-gallery-slide">
                  <img
                    src={img.image_url}
                    alt={img.caption ?? 'Galeri'}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={index === 0 ? 'high' : 'low'}
                  />
                  {img.caption?.trim() && (
                    <figcaption>{img.caption}</figcaption>
                  )}
                </figure>
              </SplideSlide>
            ))}
          </Splide>
        ) : (
          <div
            className="inv-gallery-placeholder"
            style={{ height: `${slider.height_px}px` }}
            aria-hidden
          />
        )}
      </div>
    </section>
  )
}

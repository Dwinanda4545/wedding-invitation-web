import { useMemo, type CSSProperties } from 'react'
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
}

export function GallerySection({
  images,
  tagColor,
  title = 'Galeri',
  showTitle = true,
  sliderSettings,
}: Props) {
  const slider = mergeGallerySlider(sliderSettings)

  const options = useMemo(
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
      speed: 650,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      breakpoints: {
        640: {
          perPage: slider.type === 'fade' ? 1 : Math.min(slider.per_page, 2),
          height: `${Math.round(slider.height_px * 0.85)}px`,
        },
      },
    }),
    [slider],
  )

  if (images.length === 0) return null

  return (
    <section className="inv-section inv-animate-fade-up">
      <SectionTitle title={title} show={showTitle} tagColor={tagColor} />
      <div
        className="inv-gallery-splide mx-auto max-w-lg px-2"
        data-theme={slider.theme}
        style={
          {
            '--inv-gallery-accent': tagColor ?? '#be185d',
          } as CSSProperties
        }
      >
        <Splide options={options} aria-label={title}>
          {images.map((img) => (
            <SplideSlide key={img.id}>
              <figure className="inv-gallery-slide">
                <img
                  src={img.image_url}
                  alt={img.caption ?? 'Galeri'}
                  loading="lazy"
                />
                {img.caption?.trim() && (
                  <figcaption>{img.caption}</figcaption>
                )}
              </figure>
            </SplideSlide>
          ))}
        </Splide>
      </div>
    </section>
  )
}

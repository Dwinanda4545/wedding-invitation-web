import type { GalleryImage } from '../../lib/invitationTypes'

type Props = {
  images: GalleryImage[]
  tagColor?: string
}

export function GallerySection({ images, tagColor }: Props) {
  if (images.length === 0) return null

  return (
    <section className="inv-section inv-animate-fade-up">
      <h2 className="inv-section-title" style={{ color: tagColor }}>
        Photo Gallery
      </h2>
      <div className="inv-gallery-grid mx-auto max-w-md">
        {images.map((img) => (
          <div key={img.id} className="inv-gallery-item">
            <img src={img.image_url} alt={img.caption ?? 'Galeri'} loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  )
}

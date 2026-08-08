import type { LoveStoryItem } from '../../lib/invitationTypes'
import { SectionTitle } from './SectionTitle'

type Props = {
  stories: LoveStoryItem[]
  tagColor?: string
  title?: string
  showTitle?: boolean
}

export function LoveStorySection({
  stories,
  tagColor,
  title = 'Cerita Cinta',
  showTitle = true,
}: Props) {
  if (stories.length === 0) return null

  return (
    <section className="inv-section inv-animate-fade-up">
      <SectionTitle title={title} show={showTitle} tagColor={tagColor} />
      <div className="inv-timeline mx-auto max-w-md">
        {stories.map((story, idx) => (
          <div key={story.id ?? idx} className="inv-timeline-item">
            <h3 className="font-serif text-lg font-semibold" style={{ color: tagColor }}>
              {story.title}
            </h3>
            {story.date_label && (
              <p className="mt-1 text-xs uppercase tracking-wider opacity-60" style={{ color: tagColor }}>
                {story.date_label}
              </p>
            )}
            {story.story && (
              <p className="mt-2 text-sm leading-relaxed opacity-85">
                {story.story}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

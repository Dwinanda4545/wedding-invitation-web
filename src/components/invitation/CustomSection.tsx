import DOMPurify from 'dompurify'
import type { CustomSection as CustomSectionData } from '../../lib/invitationTypes'

type Props = {
  section: CustomSectionData
  tagColor?: string
}

export function CustomSection({ section, tagColor }: Props) {
  const html = DOMPurify.sanitize(section.content || '')

  return (
    <section className="inv-section inv-animate-fade-up">
      {section.title.trim() && (
        <h2 className="inv-section-title" style={{ color: tagColor }}>
          {section.title}
        </h2>
      )}
      <div
        className="invitation-content mx-auto max-w-md text-center text-sm leading-relaxed opacity-90"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}

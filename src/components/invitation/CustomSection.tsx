import type { CustomSection as CustomSectionData } from '../../lib/invitationTypes'
import { sanitizeRichHtml } from '../../lib/richHtml'
import { SectionTitle } from './SectionTitle'

type Props = {
  section: CustomSectionData
  tagColor?: string
}

export function CustomSection({ section, tagColor }: Props) {
  const html = sanitizeRichHtml(section.content || '')

  return (
    <section className="inv-section inv-animate-fade-up">
      <SectionTitle
        title={section.title}
        show={section.show_title !== false}
        tagColor={tagColor}
      />
      <div
        className="invitation-quote ck-content mx-auto max-w-md text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}

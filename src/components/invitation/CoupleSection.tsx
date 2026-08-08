import type { CoupleInfo } from '../../lib/invitationTypes'
import { hasRichText, sanitizeRichHtml } from '../../lib/richHtml'
import { SectionTitle } from './SectionTitle'
import './invitation.css'

type Props = {
  coupleInfo: CoupleInfo
  tagColor?: string
  title?: string
  showTitle?: boolean
}

function PersonCard({
  label,
  person,
  side,
  tagColor,
}: {
  label: string
  person?: CoupleInfo['groom']
  side: 'groom' | 'bride'
  tagColor?: string
}) {
  if (!person) return null
  const hasContent =
    person.nickname || person.full_name || person.father || person.mother
  if (!hasContent) return null

  return (
    <div className="mt-8 mb-8 flex-1 text-center">
      <p className="text-xs uppercase tracking-[0.2em] opacity-60">{label}</p>
      {person.photo_url && (
        <img
          src={person.photo_url}
          alt={person.nickname ?? person.full_name ?? label}
          className="mx-auto mt-4 h-28 w-28 rounded-full object-cover ring-2 ring-white/40"
        />
      )}
      <h3 className="mt-4 font-serif text-2xl font-semibold" style={{ color: tagColor }}>
        {person.nickname || person.full_name}
      </h3>
      {person.full_name && person.nickname && (
        <p className="mt-1 text-sm opacity-80">{person.full_name}</p>
      )}
      {(person.father || person.mother) && (
        <div className="mt-4 text-sm opacity-75">
          <p>
            {side === 'groom' ? 'Putra' : 'Putri'} dari {person.father ?? ''}
          </p>
          {person.mother && <p>& {person.mother}</p>}
        </div>
      )}
      {person.city && (
        <p className="mt-2 text-xs opacity-60">{person.city}</p>
      )}
    </div>
  )
}

export function CoupleSection({
  coupleInfo,
  tagColor,
  title = 'Mempelai',
  showTitle = true,
}: Props) {
  const quote = coupleInfo.opening_quote
  const showQuote = hasRichText(quote)
  const quoteHtml = showQuote ? sanitizeRichHtml(quote ?? '') : ''

  return (
    <section className="inv-section inv-animate-fade-up">
      <SectionTitle title={title} show={showTitle} tagColor={tagColor} />
      {showQuote && (
        <div
          className="invitation-quote ck-content mx-auto mb-8 max-w-lg"
          style={{ textAlign: 'initial' }}
          dangerouslySetInnerHTML={{ __html: quoteHtml }}
        />
      )}
      <div className="flex flex-col items-center gap-10">
        <PersonCard label="Mempelai Pria" person={coupleInfo.groom} side="groom" tagColor={tagColor} />
        <p className="my-2 font-serif text-3xl opacity-40">&</p>
        <PersonCard label="Mempelai Wanita" person={coupleInfo.bride} side="bride" tagColor={tagColor} />
      </div>
    </section>
  )
}

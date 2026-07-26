import type { CoupleInfo } from '../../lib/invitationTypes'

type Props = {
  coupleInfo: CoupleInfo
  tagColor?: string
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
    <div className="flex-1 text-center">
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

export function CoupleSection({ coupleInfo, tagColor }: Props) {
  const quote = coupleInfo.opening_quote?.trim()

  return (
    <section className="inv-section inv-animate-fade-up">
      <h2 className="inv-section-title" style={{ color: tagColor }}>
        Mempelai
      </h2>
      {quote && (
        <p className="mx-auto mb-8 max-w-md text-center text-sm italic opacity-80">
          {quote}
        </p>
      )}
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
        <PersonCard label="Mempelai Pria" person={coupleInfo.groom} side="groom" tagColor={tagColor} />
        <p className="font-serif text-3xl opacity-40">&</p>
        <PersonCard label="Mempelai Wanita" person={coupleInfo.bride} side="bride" tagColor={tagColor} />
      </div>
    </section>
  )
}

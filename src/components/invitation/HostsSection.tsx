import type { HostsInfo } from '../../lib/invitationTypes'

type Props = {
  hosts: HostsInfo
  tagColor?: string
}

function HostList({
  title,
  items,
  tagColor,
}: {
  title: string
  items: string[]
  tagColor?: string
}) {
  if (items.length === 0) return null
  return (
    <div className="flex-1">
      <h3 className="text-center font-serif text-lg font-semibold">{title}</h3>
      <ol className="mt-4 space-y-2 text-sm opacity-85" style={{ color: tagColor }}>
        {items.map((item, idx) => (
          <li key={idx}>
            {idx + 1}. {item}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function HostsSection({ hosts, tagColor }: Props) {
  const groomSide = hosts.groom_side ?? []
  const brideSide = hosts.bride_side ?? []
  if (groomSide.length === 0 && brideSide.length === 0) return null

  return (
    <section className="inv-section inv-animate-fade-up">
      <h2 className="inv-section-title" style={{ color: tagColor }}>
        Turut Mengundang
      </h2>
      <div className="mx-auto flex max-w-lg flex-col gap-8 md:flex-row">
        <HostList title="Kel. Mempelai Pria" items={groomSide} tagColor={tagColor} />
        <HostList title="Kel. Mempelai Wanita" items={brideSide} tagColor={tagColor} />
      </div>
    </section>
  )
}

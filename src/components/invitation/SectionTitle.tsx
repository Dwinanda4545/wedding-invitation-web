type Props = {
  title: string
  show?: boolean
  tagColor?: string
}

export function SectionTitle({ title, show = true, tagColor }: Props) {
  if (!show || !title.trim()) return null

  return (
    <h2 className="inv-section-title" style={{ color: tagColor }}>
      {title}
    </h2>
  )
}

import type { DecorSlot } from './invitationTypes'

export type DecorPreset = {
  id: string
  label: string
  image_url: string
  default_slot: DecorSlot
  default_width: number
  default_opacity: number
}

export const DECOR_PRESETS: DecorPreset[] = [
  {
    id: 'floral-corner',
    label: 'Floral Corner',
    image_url: '/decor/floral-corner.svg',
    default_slot: 'tl',
    default_width: 28,
    default_opacity: 0.85,
  },
  {
    id: 'sakura-branch',
    label: 'Sakura Branch',
    image_url: '/decor/sakura-branch.svg',
    default_slot: 'tr',
    default_width: 38,
    default_opacity: 0.9,
  },
  {
    id: 'leaf-sprig',
    label: 'Leaf Sprig',
    image_url: '/decor/leaf-sprig.svg',
    default_slot: 'bl',
    default_width: 22,
    default_opacity: 0.8,
  },
  {
    id: 'ribbon-bow',
    label: 'Ribbon Bow',
    image_url: '/decor/ribbon-bow.svg',
    default_slot: 'tc',
    default_width: 32,
    default_opacity: 0.75,
  },
  {
    id: 'rose-bouquet',
    label: 'Rose Bouquet',
    image_url: '/decor/rose-bouquet.svg',
    default_slot: 'br',
    default_width: 26,
    default_opacity: 0.9,
  },
  {
    id: 'butterfly',
    label: 'Butterfly',
    image_url: '/decor/butterfly.svg',
    default_slot: 'tc',
    default_width: 20,
    default_opacity: 0.7,
  },
]

export const DECOR_SLOT_LABELS: Record<DecorSlot, string> = {
  tl: 'Pojok kiri atas',
  tr: 'Pojok kanan atas',
  bl: 'Pojok kiri bawah',
  br: 'Pojok kanan bawah',
  tc: 'Tengah atas',
  bc: 'Tengah bawah',
}

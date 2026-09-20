declare module '@splidejs/react-splide' {
  import type { Options, Splide as SplideCore } from '@splidejs/splide'
  import type { Component, ComponentType, ReactNode } from 'react'

  export type { Options }

  export type SplideProps = {
    options?: Options
    extensions?: Record<string, unknown>
    transition?: unknown
    hasTrack?: boolean
    tag?: string
    id?: string
    className?: string
    'aria-label'?: string
    'aria-labelledby'?: string
    children?: ReactNode
    onMounted?: (splide: SplideCore) => void
    onReady?: (splide: SplideCore) => void
    onMove?: (
      splide: SplideCore,
      newIndex: number,
      prevIndex: number,
      destIndex: number,
    ) => void
    onMoved?: (
      splide: SplideCore,
      newIndex: number,
      prevIndex: number,
      destIndex: number,
    ) => void
    onActive?: (splide: SplideCore, slide: unknown) => void
    onResized?: (splide: SplideCore) => void
    onRefresh?: (splide: SplideCore) => void
  }

  export type SplideSlideProps = {
    className?: string
    children?: ReactNode
  }

  export class Splide extends Component<SplideProps> {
    splide: SplideCore | undefined
    go(control: number | string): void
  }

  export const SplideSlide: ComponentType<SplideSlideProps>
  export const SplideTrack: ComponentType<{ children?: ReactNode; className?: string }>
}

declare module '@splidejs/react-splide/css'
declare module '@splidejs/react-splide/css/core'
declare module '@splidejs/react-splide/css/*'

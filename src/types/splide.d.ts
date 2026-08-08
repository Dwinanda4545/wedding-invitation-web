declare module '@splidejs/react-splide' {
  import type { ComponentType, ReactNode } from 'react'

  export type Options = Record<string, unknown>

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
  }

  export type SplideSlideProps = {
    className?: string
    children?: ReactNode
  }

  export const Splide: ComponentType<SplideProps>
  export const SplideSlide: ComponentType<SplideSlideProps>
  export const SplideTrack: ComponentType<{ children?: ReactNode; className?: string }>
}

declare module '@splidejs/react-splide/css'
declare module '@splidejs/react-splide/css/core'
declare module '@splidejs/react-splide/css/*'

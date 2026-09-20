import { useEffect, type RefObject } from 'react'

const SELECTOR = '.inv-animate-fade-up, .inv-reveal'

/**
 * Play section enter animations when elements enter the viewport,
 * and reset so they can replay when scrolling back into view.
 */
export function useScrollReplayAnimations(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    const root = rootRef.current
    if (!root) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        el.classList.add('is-visible')
      })
      return
    }

    const observed = new Set<Element>()

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target
          if (entry.isIntersecting && entry.intersectionRatio >= 0.12) {
            if (!el.classList.contains('is-visible')) {
              el.classList.add('is-visible')
            }
          } else if (entry.intersectionRatio === 0) {
            el.classList.remove('is-visible')
          }
        }
      },
      {
        threshold: [0, 0.12, 0.35],
        rootMargin: '0px 0px -8% 0px',
      },
    )

    function observeAll() {
      const elRoot = rootRef.current
      if (!elRoot) return
      elRoot.querySelectorAll(SELECTOR).forEach((el) => {
        if (observed.has(el)) return
        observed.add(el)
        io.observe(el)
      })
    }

    observeAll()

    const mo = new MutationObserver(() => observeAll())
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      io.disconnect()
      observed.clear()
    }
  }, [rootRef, enabled])
}

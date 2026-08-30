import { describe, expect, it } from 'vitest'
import { MOBILE_VIEWPORT_WIDTH, mobileCanvasScale } from './mobileViewport'

describe('mobileCanvasScale', () => {
  it('keeps scale 1 on screens wider than the canvas', () => {
    expect(mobileCanvasScale(1280)).toBe(1)
    expect(mobileCanvasScale(MOBILE_VIEWPORT_WIDTH)).toBe(1)
  })

  it('scales down to fit a phone viewport', () => {
    expect(mobileCanvasScale(360)).toBeCloseTo(360 / 720)
    expect(mobileCanvasScale(390)).toBeCloseTo(390 / 720)
  })

  it('does not invert or explode on invalid sizes', () => {
    expect(mobileCanvasScale(0)).toBe(1)
    expect(mobileCanvasScale(-10)).toBe(1)
    expect(mobileCanvasScale(390, 0)).toBe(1)
  })
})

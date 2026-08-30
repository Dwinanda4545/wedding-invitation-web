export const MOBILE_VIEWPORT_WIDTH = 720

/**
 * Scale the 720px mobile canvas to the device width, never larger than 1×
 * (phones: full-bleed; PC/tablet wider than 720: fixed 720px column).
 */
export function mobileCanvasScale(
  viewportWidth: number,
  canvasWidth = MOBILE_VIEWPORT_WIDTH,
): number {
  if (viewportWidth <= 0 || canvasWidth <= 0) return 1
  return Math.min(1, viewportWidth / canvasWidth)
}

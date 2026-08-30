export const MOBILE_VIEWPORT_WIDTH = 720

/** Scale the 720px mobile canvas so it fits the device width (never upscale). */
export function mobileCanvasScale(
  viewportWidth: number,
  canvasWidth = MOBILE_VIEWPORT_WIDTH,
): number {
  if (viewportWidth <= 0 || canvasWidth <= 0) return 1
  return Math.min(1, viewportWidth / canvasWidth)
}

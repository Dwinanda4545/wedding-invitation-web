import { useCallback, useRef, useState } from 'react'
import type { DecorAsset, InvitationSettings } from '../../lib/invitationTypes'

type Props = {
  settings: InvitationSettings
  previewMode?: boolean
  /** Mode edit: asset bisa digeser (full preview admin) */
  editDecor?: boolean
  onAssetsChange?: (assets: DecorAsset[]) => void
}

const SLOT_CLASS: Record<string, string> = {
  tl: 'inv-decor-tl',
  tr: 'inv-decor-tr',
  bl: 'inv-decor-bl',
  br: 'inv-decor-br',
  tc: 'inv-decor-tc',
  bc: 'inv-decor-bc',
}

const SLOT_DEFAULT_POS: Record<string, { x: number; y: number }> = {
  tl: { x: 2, y: 2 },
  tr: { x: 72, y: 2 },
  bl: { x: 2, y: 78 },
  br: { x: 72, y: 78 },
  tc: { x: 35, y: 1 },
  bc: { x: 35, y: 85 },
}

function hasFreePos(asset: DecorAsset) {
  return typeof asset.x_percent === 'number' && typeof asset.y_percent === 'number'
}

export function DecorLayers({
  settings,
  editDecor = false,
  onAssetsChange,
}: Props) {
  const assetsLayerRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragRef = useRef<{
    id: string
    offsetX: number
    offsetY: number
  } | null>(null)

  const bgUrl = settings.background_image_url?.trim()
  const overlay = settings.background_overlay ?? 0.25
  const assets: DecorAsset[] = settings.decor_assets ?? []

  const hasBg = Boolean(bgUrl)
  const hasAssets = assets.length > 0

  const updateAssetPos = useCallback(
    (id: string, x_percent: number, y_percent: number) => {
      if (!onAssetsChange) return
      onAssetsChange(
        assets.map((a) =>
          a.id === id
            ? {
                ...a,
                x_percent: Math.min(92, Math.max(0, x_percent)),
                y_percent: Math.min(92, Math.max(0, y_percent)),
              }
            : a,
        ),
      )
    },
    [assets, onAssetsChange],
  )

  function onPointerDown(e: React.PointerEvent, asset: DecorAsset) {
    if (!editDecor || !assetsLayerRef.current) return
    e.preventDefault()
    e.stopPropagation()

    const root = assetsLayerRef.current.getBoundingClientRect()
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()

    let startX = asset.x_percent
    let startY = asset.y_percent
    if (typeof startX !== 'number' || typeof startY !== 'number') {
      startX = ((rect.left - root.left) / root.width) * 100
      startY = ((rect.top - root.top) / root.height) * 100
      updateAssetPos(asset.id, startX, startY)
    }

    dragRef.current = {
      id: asset.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }
    setDraggingId(asset.id)
    el.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!editDecor || !dragRef.current || !assetsLayerRef.current) return
    const root = assetsLayerRef.current.getBoundingClientRect()
    const { id, offsetX, offsetY } = dragRef.current
    const x = ((e.clientX - offsetX - root.left) / root.width) * 100
    const y = ((e.clientY - offsetY - root.top) / root.height) * 100
    updateAssetPos(id, x, y)
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragRef.current) return
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    dragRef.current = null
    setDraggingId(null)
  }

  if (!hasBg && !hasAssets) return null

  return (
    <>
      {/* Background selalu di belakang konten (z-index 0) */}
      {hasBg && (
        <div className="inv-decor-bg-layer" aria-hidden="true">
          <img
            src={bgUrl}
            alt=""
            className="inv-decor-bg"
            draggable={false}
          />
          {overlay > 0 && (
            <div
              className="inv-decor-overlay"
              style={{ opacity: Math.min(overlay, 0.85) }}
            />
          )}
        </div>
      )}

      {/* Asset di atas konten agar ornamen terlihat; tidak menutupi teks secara solid */}
      {hasAssets && (
        <div
          ref={assetsLayerRef}
          className={['inv-decor-assets-layer', editDecor ? 'is-edit' : ''].join(' ')}
          aria-hidden={!editDecor}
        >
          {assets.map((asset) => {
            const free = hasFreePos(asset)
            const fallback = SLOT_DEFAULT_POS[asset.slot] ?? SLOT_DEFAULT_POS.tl
            const style: React.CSSProperties = {
              width: `${asset.width_percent}%`,
              opacity: asset.opacity,
              ...(free || (editDecor && draggingId === asset.id)
                ? {
                    left: `${asset.x_percent ?? fallback.x}%`,
                    top: `${asset.y_percent ?? fallback.y}%`,
                    right: 'auto',
                    bottom: 'auto',
                    transform: 'none',
                  }
                : {}),
            }

            return (
              <img
                key={asset.id}
                src={asset.image_url}
                alt=""
                draggable={false}
                className={[
                  'inv-decor-asset',
                  free || draggingId === asset.id
                    ? 'inv-decor-free'
                    : (SLOT_CLASS[asset.slot] ?? 'inv-decor-tl'),
                  editDecor ? 'is-draggable' : '',
                  draggingId === asset.id ? 'is-dragging' : '',
                ].join(' ')}
                style={style}
                onPointerDown={(e) => onPointerDown(e, asset)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />
            )
          })}
        </div>
      )}
    </>
  )
}

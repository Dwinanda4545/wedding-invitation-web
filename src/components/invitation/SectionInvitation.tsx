import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { DecorAsset, InvitationResponse } from '../../lib/invitationTypes'
import {
  formatEventDate,
  getSectionCustom,
  getSectionTitle,
  isSectionCustomMode,
  mergeCoupleInfo,
  mergeHosts,
  mergeSettings,
  parseCustomSectionOrderKey,
  resolveSectionOrder,
} from '../../lib/invitationTypes'
import { CustomSectionFrame } from './CustomSectionFrame'
import {
  getInvitationTheme,
  themePageStyle,
} from '../../lib/invitationTemplates'
import { toSectionCustomThemeBits } from '../../lib/sectionCustom'
import { CoverSection } from './CoverSection'
import { HeroSection } from './HeroSection'
import { CoupleSection } from './CoupleSection'
import { ScheduleSection } from './ScheduleSection'
import { LoveStorySection } from './LoveStorySection'
import { GallerySection } from './GallerySection'
import { WishesSection } from './WishesSection'
import { DigitalEnvelopeSection } from './DigitalEnvelopeSection'
import { HostsSection } from './HostsSection'
import { QrSection } from './QrSection'
import { CustomSection } from './CustomSection'
import { SakuraAnimation } from './SakuraAnimation'
import { FallingLeavesAnimation } from './FallingLeavesAnimation'
import { FallingLeavesToggle } from './FallingLeavesToggle'
import { SideCharacters } from './SideCharacters'
import { SideCharactersToggle } from './SideCharactersToggle'
import { MusicPlayer, type MusicPlayerHandle } from './MusicPlayer'
import { DecorLayers } from './DecorLayers'
import { SectionBackgroundShell } from './SectionBackgroundShell'
import { MOBILE_VIEWPORT_WIDTH, mobileCanvasScale } from '../../lib/mobileViewport'
import type { EnvelopePaymentResult } from '../../lib/envelopeTypes'
import { useScrollReplayAnimations } from '../../hooks/useScrollReplayAnimations'
import './invitation.css'

type Props = {
  data: InvitationResponse
  secretToken: string
  previewMode?: boolean
  paymentResult?: EnvelopePaymentResult
  /** Mode edit asset dekoratif (geser di full preview admin) */
  editDecor?: boolean
  onDecorAssetsChange?: (assets: DecorAsset[]) => void
}

export function SectionInvitation({
  data,
  secretToken,
  previewMode = false,
  paymentResult = null,
  editDecor = false,
  onDecorAssetsChange,
}: Props) {
  const [coverOpen, setCoverOpen] = useState(previewMode || editDecor)
  const [wishes, setWishes] = useState(data.event.wishes ?? [])
  const [contentMounted, setContentMounted] = useState(
    previewMode || editDecor || data.event.invitation_settings?.cover_enabled === false,
  )
  const [sakuraReady, setSakuraReady] = useState(false)
  const [leavesReady, setLeavesReady] = useState(false)
  const [leavesOn, setLeavesOn] = useState(false)
  const [charsReady, setCharsReady] = useState(false)
  const [charsOn, setCharsOn] = useState(false)
  const musicRef = useRef<MusicPlayerHandle>(null)
  const musicTimerRef = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const theme = useMemo(
    () =>
      getInvitationTheme(
        data.event.invitation_template,
        data.event.invitation_style,
      ),
    [data.event.invitation_template, data.event.invitation_style],
  )

  const settings = mergeSettings(data.event.invitation_settings)
  const coupleInfo = mergeCoupleInfo(data.event.couple_info)
  const hosts = mergeHosts(data.event.hosts)
  const sections = settings.sections ?? {}
  const leavesDefault = settings.falling_leaves_enabled !== false
  const charsDefault = settings.side_characters_enabled === true
  const customById = useMemo(() => {
    const map = new Map(
      (settings.custom_sections ?? []).map((section) => [section.id, section]),
    )
    return map
  }, [settings.custom_sections])
  const sectionOrder = resolveSectionOrder(settings)
  const viewportMode = settings.viewport_mode ?? 'existing'
  const isMobileViewport = viewportMode === 'mobile' && !previewMode
  const frameRef = useRef<HTMLDivElement>(null)
  const [mobileScale, setMobileScale] = useState(1)
  const [mobileFrameHeight, setMobileFrameHeight] = useState(0)

  useLayoutEffect(() => {
    if (!isMobileViewport) {
      setMobileScale(1)
      return
    }
    function updateScale() {
      // clientWidth excludes scrollbar; matches visible layout width
      setMobileScale(mobileCanvasScale(document.documentElement.clientWidth))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    window.visualViewport?.addEventListener('resize', updateScale)
    return () => {
      window.removeEventListener('resize', updateScale)
      window.visualViewport?.removeEventListener('resize', updateScale)
    }
  }, [isMobileViewport])

  useEffect(() => {
    if (!isMobileViewport || !frameRef.current) return
    const el = frameRef.current
    const syncHeight = () => setMobileFrameHeight(el.scrollHeight)
    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [isMobileViewport, coverOpen, wishes, mobileScale])

  const pageStyle = {
    ...themePageStyle(theme),
    ...(previewMode
      ? { minHeight: '100%', height: 'auto' }
      : {}),
  }

  const mobileDisplayWidth = Math.round(MOBILE_VIEWPORT_WIDTH * mobileScale)

  const frameStyle = isMobileViewport
    ? {
        ...pageStyle,
        width: MOBILE_VIEWPORT_WIDTH,
        maxWidth: MOBILE_VIEWPORT_WIDTH,
        minHeight: `calc(100dvh / ${mobileScale})`,
        transform: mobileScale < 1 ? `scale(${mobileScale})` : undefined,
        transformOrigin: 'top left',
        ['--inv-mobile-scale' as string]: String(mobileScale),
      }
    : previewMode
      ? pageStyle
      : undefined

  const shellStyle = isMobileViewport
    ? {
        minHeight: '100dvh',
        width: '100%',
        background: theme.style.pageBackground,
        ['--inv-mobile-scale' as string]: String(mobileScale),
        overflowX: 'hidden' as const,
      }
    : pageStyle

  const showSakura = data.event.invitation_template === 'cherry-blossom'

  function handleWishChanged(wish: (typeof wishes)[number]) {
    setWishes((prev) => {
      const rest = prev.filter((item) => item.id !== wish.id)
      return [wish, ...rest]
    })
  }

  function handleOpenCover() {
    setCoverOpen(true)
    if (musicTimerRef.current) window.clearTimeout(musicTimerRef.current)
    // Defer music so it does not compete with first content paint.
    musicTimerRef.current = window.setTimeout(() => {
      musicRef.current?.play()
    }, 450)
  }

  const contentVisible = !settings.cover_enabled || coverOpen

  useEffect(() => {
    setLeavesOn(leavesDefault)
  }, [leavesDefault])

  useEffect(() => {
    setCharsOn(charsDefault)
  }, [charsDefault])

  useEffect(() => {
    if (!contentVisible) {
      setContentMounted(false)
      setSakuraReady(false)
      setLeavesReady(false)
      setCharsReady(false)
      return
    }
    // Preview / no-cover: mount immediately. Live invite: short delay after open.
    const delay = previewMode || editDecor || settings.cover_enabled === false ? 0 : 280
    const t = window.setTimeout(() => setContentMounted(true), delay)
    return () => window.clearTimeout(t)
  }, [contentVisible, previewMode, editDecor, settings.cover_enabled])

  useEffect(() => {
    if (!contentVisible || !showSakura) {
      setSakuraReady(false)
      return
    }
    const t = window.setTimeout(() => setSakuraReady(true), 800)
    return () => window.clearTimeout(t)
  }, [contentVisible, showSakura])

  useEffect(() => {
    if (!contentVisible || !leavesOn) {
      setLeavesReady(false)
      return
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setLeavesReady(false)
      return
    }
    const t = window.setTimeout(() => setLeavesReady(true), 650)
    return () => window.clearTimeout(t)
  }, [contentVisible, leavesOn])

  useEffect(() => {
    if (!contentVisible || !charsOn) {
      setCharsReady(false)
      return
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setCharsReady(false)
      return
    }
    const t = window.setTimeout(() => setCharsReady(true), 650)
    return () => window.clearTimeout(t)
  }, [contentVisible, charsOn])

  useEffect(() => {
    return () => {
      if (musicTimerRef.current) window.clearTimeout(musicTimerRef.current)
    }
  }, [])

  useScrollReplayAnimations(contentRef, contentMounted)

  const coverStyle = isMobileViewport
    ? {
        ...pageStyle,
        minHeight: `calc(100dvh / ${mobileScale})`,
        height: `calc(100dvh / ${mobileScale})`,
      }
    : previewMode
      ? { ...pageStyle, position: 'absolute' as const, inset: 0 }
      : pageStyle

  const customTheme = toSectionCustomThemeBits(theme.style)

  const frameData = {
    ...data,
    event: { ...data.event, wishes },
  }

  function renderCustomFrame(key: string, variant: 'content' | 'cover' = 'content') {
    return (
      <CustomSectionFrame
        key={key}
        sectionKey={key}
        code={getSectionCustom(settings, key)}
        data={frameData}
        theme={customTheme}
        settings={settings}
        variant={variant}
        isOpen={coverOpen}
        coverStyle={{ ...coverStyle, padding: 0 }}
        onOpenCover={handleOpenCover}
        paymentResult={paymentResult}
        onError={(message) => {
          if (previewMode) return
          console.warn(`[invitation ${key}]`, message)
        }}
      />
    )
  }

  function renderBuiltin(key: string) {
    const builtinKey = key as
      | 'couple'
      | 'schedule'
      | 'love_story'
      | 'gallery'
      | 'wishes'
      | 'hosts'
      | 'digital_envelope'
      | 'qr'
    const sectionTitle = getSectionTitle(settings, builtinKey)

      if (builtinKey !== 'qr' && isSectionCustomMode(settings, builtinKey)) {
      if (sections[builtinKey] === false) return null
      return (
        <SectionBackgroundShell
          key={key}
          sectionKey={builtinKey}
          settings={settings}
          className="inv-reveal"
        >
          {renderCustomFrame(builtinKey)}
        </SectionBackgroundShell>
      )
    }

    switch (builtinKey) {
      case 'couple':
        if (sections.couple === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="couple" settings={settings}>
            <div className="mx-auto max-w-lg">
              <CoupleSection
                coupleInfo={coupleInfo}
                tagColor={theme.style.tagColor}
                title={sectionTitle.text}
                showTitle={sectionTitle.show}
              />
            </div>
          </SectionBackgroundShell>
        )
      case 'schedule':
        if (sections.schedule === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="schedule" settings={settings}>
            <div className="mx-auto max-w-lg">
              <ScheduleSection
                schedules={data.event.schedules ?? []}
                fallbackDate={data.event.event_date}
                fallbackLocation={data.event.location}
                tagColor={theme.style.tagColor}
                title={sectionTitle.text}
                showTitle={sectionTitle.show}
              />
            </div>
          </SectionBackgroundShell>
        )
      case 'love_story':
        if (sections.love_story === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="love_story" settings={settings}>
            <div className="mx-auto max-w-lg">
              <LoveStorySection
                stories={data.event.love_stories ?? []}
                tagColor={theme.style.tagColor}
                title={sectionTitle.text}
                showTitle={sectionTitle.show}
              />
            </div>
          </SectionBackgroundShell>
        )
      case 'gallery':
        if (sections.gallery === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="gallery" settings={settings}>
            <div className="mx-auto max-w-lg">
              <GallerySection
                images={data.event.gallery ?? []}
                tagColor={theme.style.tagColor}
                title={sectionTitle.text}
                showTitle={sectionTitle.show}
                sliderSettings={settings.gallery_slider}
                enabled={contentMounted}
              />
            </div>
          </SectionBackgroundShell>
        )
      case 'wishes':
        if (sections.wishes === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="wishes" settings={settings}>
            <div className="mx-auto max-w-lg">
              <WishesSection
                secretToken={secretToken}
                guestName={data.guest.name}
                wishes={wishes}
                myWish={data.guest.wish}
                onWishChanged={handleWishChanged}
                tagColor={theme.style.tagColor}
                title={sectionTitle.text}
                showTitle={sectionTitle.show}
                isUniversal={Boolean(data.is_universal)}
              />
            </div>
          </SectionBackgroundShell>
        )
      case 'hosts':
        if (sections.hosts === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="hosts" settings={settings}>
            <div className="mx-auto max-w-lg">
              <HostsSection
                hosts={hosts}
                tagColor={theme.style.tagColor}
                title={sectionTitle.text}
                showTitle={sectionTitle.show}
              />
            </div>
          </SectionBackgroundShell>
        )
      case 'digital_envelope':
        if (sections.digital_envelope !== true) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="digital_envelope" settings={settings}>
            <div className="mx-auto max-w-lg">
              <DigitalEnvelopeSection
                secretToken={secretToken}
                guestName={data.guest.name}
                envelopeSettings={settings.digital_envelope}
                paymentResult={paymentResult}
                tagColor={theme.style.tagColor}
                title={sectionTitle.text}
                showTitle={sectionTitle.show}
                isUniversal={Boolean(data.is_universal)}
              />
            </div>
          </SectionBackgroundShell>
        )
      case 'qr':
        if (data.is_universal || sections.qr === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="qr" settings={settings}>
            <div className="mx-auto max-w-lg">
              <QrSection
                qrCodeUrl={data.guest.qr_code_url}
                isAttended={Boolean(data.guest.is_attended)}
                theme={theme}
                title={sectionTitle.text}
                showTitle={sectionTitle.show}
              />
            </div>
          </SectionBackgroundShell>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={[
        'invitation-shell',
        previewMode ? 'is-preview' : '',
        isMobileViewport ? 'inv-viewport-mobile' : 'inv-viewport-existing',
      ]
        .filter(Boolean)
        .join(' ')}
      style={shellStyle}
    >
      <div
        className="inv-viewport-scale"
        style={
          isMobileViewport
            ? {
                width: mobileDisplayWidth,
                maxWidth: '100%',
                margin: '0 auto',
                overflow: 'hidden',
                ...(mobileScale < 1 && mobileFrameHeight > 0
                  ? { height: mobileFrameHeight * mobileScale }
                  : {}),
              }
            : undefined
        }
      >
      <div ref={frameRef} className="inv-viewport-frame" style={frameStyle}>
        <DecorLayers
          settings={settings}
          previewMode={previewMode}
          editDecor={editDecor}
          onAssetsChange={onDecorAssetsChange}
        />

        {isSectionCustomMode(settings, 'cover') ? (
          settings.cover_enabled !== false ? (
            renderCustomFrame('cover', 'cover')
          ) : null
        ) : (
          <CoverSection
            settings={settings}
            eventName={data.event.name}
            eventDateLabel={formatEventDate(data.event.event_date)}
            guestName={data.guest.name}
            guestType={data.guest.guest_type ?? ''}
            onOpen={handleOpenCover}
            style={coverStyle}
            isOpen={coverOpen}
            tagColor={theme.style.tagColor}
          />
        )}

        {contentMounted ? (
        <div ref={contentRef} className="inv-content inv-animate-fade-in">
          {isSectionCustomMode(settings, 'hero') ? (
            <SectionBackgroundShell
              sectionKey="hero"
              settings={settings}
              className="inv-reveal"
            >
              {renderCustomFrame('hero')}
            </SectionBackgroundShell>
          ) : (
            <SectionBackgroundShell sectionKey="hero" settings={settings}>
              <div className="mx-auto max-w-lg">
                <HeroSection
                  eventName={data.event.name}
                  eventDate={data.event.event_date}
                  coupleInfo={coupleInfo}
                  settings={settings}
                  tagColor={theme.style.tagColor}
                />
              </div>
            </SectionBackgroundShell>
          )}

          {sectionOrder.map((key) => {
            const customId = parseCustomSectionOrderKey(key)
            if (customId) {
              const custom = customById.get(customId)
              if (!custom || custom.enabled === false) return null
              if (isSectionCustomMode(settings, key)) {
                return (
                  <div key={key} className="inv-reveal">
                    {renderCustomFrame(key)}
                  </div>
                )
              }
              return (
                <div key={key} className="mx-auto max-w-lg">
                  <CustomSection section={custom} tagColor={theme.style.tagColor} />
                </div>
              )
            }
            return renderBuiltin(key)
          })}

          <footer className="pb-12 pt-4 text-center text-xs opacity-40">
            Undangan Digital
          </footer>
        </div>
        ) : null}
      </div>
      </div>

      {/* Outside scaled/overflow viewport so position:fixed is not clipped */}
      {showSakura && sakuraReady && <SakuraAnimation />}
      {charsReady && (
        <SideCharacters previewEmbed={previewMode || editDecor} />
      )}
      {leavesReady && (
        <FallingLeavesAnimation
          tagColor={theme.style.tagColor}
          previewEmbed={previewMode || editDecor}
        />
      )}

      {contentVisible && !editDecor && (
        <>
          <SideCharactersToggle enabled={charsOn} onChange={setCharsOn} />
          <FallingLeavesToggle enabled={leavesOn} onChange={setLeavesOn} />
        </>
      )}

      {!previewMode && !editDecor && (
        <MusicPlayer
          ref={musicRef}
          url={settings.music_url}
          enabled={settings.music_enabled}
          defaultVolume={settings.music_volume}
        />
      )}
    </div>
  )
}

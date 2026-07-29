import { useMemo, useRef, useState } from 'react'
import type { DecorAsset, InvitationResponse } from '../../lib/invitationTypes'
import {
  formatEventDate,
  mergeCoupleInfo,
  mergeHosts,
  mergeSettings,
  parseCustomSectionOrderKey,
  resolveSectionOrder,
} from '../../lib/invitationTypes'
import {
  getInvitationTheme,
  themePageStyle,
} from '../../lib/invitationTemplates'
import { CoverSection } from './CoverSection'
import { HeroSection } from './HeroSection'
import { CoupleSection } from './CoupleSection'
import { ScheduleSection } from './ScheduleSection'
import { LoveStorySection } from './LoveStorySection'
import { GallerySection } from './GallerySection'
import { WishesSection } from './WishesSection'
import { HostsSection } from './HostsSection'
import { QrSection } from './QrSection'
import { CustomSection } from './CustomSection'
import { SakuraAnimation } from './SakuraAnimation'
import { MusicPlayer, type MusicPlayerHandle } from './MusicPlayer'
import { DecorLayers } from './DecorLayers'
import { SectionBackgroundShell } from './SectionBackgroundShell'
import './invitation.css'

/** Lebar kanvas mobile — selaras dengan preview panel admin */
export const MOBILE_VIEWPORT_WIDTH = 720

type Props = {
  data: InvitationResponse
  secretToken: string
  previewMode?: boolean
  /** Mode edit asset dekoratif (geser di full preview admin) */
  editDecor?: boolean
  onDecorAssetsChange?: (assets: DecorAsset[]) => void
}

export function SectionInvitation({
  data,
  secretToken,
  previewMode = false,
  editDecor = false,
  onDecorAssetsChange,
}: Props) {
  const [coverOpen, setCoverOpen] = useState(previewMode || editDecor)
  const [wishes, setWishes] = useState(data.event.wishes ?? [])
  const musicRef = useRef<MusicPlayerHandle>(null)

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
  const customById = useMemo(() => {
    const map = new Map(
      (settings.custom_sections ?? []).map((section) => [section.id, section]),
    )
    return map
  }, [settings.custom_sections])
  const sectionOrder = resolveSectionOrder(settings)
  const viewportMode = settings.viewport_mode ?? 'existing'
  const isMobileViewport = viewportMode === 'mobile' && !previewMode

  const pageStyle = {
    ...themePageStyle(theme),
    ...(previewMode
      ? { minHeight: '100%', height: 'auto' }
      : {}),
  }

  const frameStyle = isMobileViewport
    ? {
        ...pageStyle,
        width: '100%',
        maxWidth: MOBILE_VIEWPORT_WIDTH,
        minHeight: '100vh',
      }
    : previewMode
      ? pageStyle
      : undefined

  const shellStyle = isMobileViewport
    ? {
        minHeight: '100vh',
        background: theme.style.pageBackground,
      }
    : pageStyle

  const showSakura = data.event.invitation_template === 'cherry-blossom'

  function handleWishAdded(wish: (typeof wishes)[number]) {
    setWishes((prev) => [wish, ...prev])
  }

  function handleOpenCover() {
    setCoverOpen(true)
    musicRef.current?.play()
  }

  const contentVisible = !settings.cover_enabled || coverOpen

  const coverStyle = isMobileViewport || previewMode
    ? { ...pageStyle, position: 'absolute' as const, inset: 0 }
    : pageStyle

  function renderBuiltin(key: string) {
    switch (key) {
      case 'couple':
        if (sections.couple === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="couple" settings={settings}>
            <div className="mx-auto max-w-lg">
              <CoupleSection coupleInfo={coupleInfo} tagColor={theme.style.tagColor} />
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
                onWishAdded={handleWishAdded}
                tagColor={theme.style.tagColor}
              />
            </div>
          </SectionBackgroundShell>
        )
      case 'hosts':
        if (sections.hosts === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="hosts" settings={settings}>
            <div className="mx-auto max-w-lg">
              <HostsSection hosts={hosts} tagColor={theme.style.tagColor} />
            </div>
          </SectionBackgroundShell>
        )
      case 'qr':
        if (sections.qr === false) return null
        return (
          <SectionBackgroundShell key={key} sectionKey="qr" settings={settings}>
            <div className="mx-auto max-w-lg">
              <QrSection
                qrCodeUrl={data.guest.qr_code_url}
                isAttended={Boolean(data.guest.is_attended)}
                theme={theme}
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
      <div className="inv-viewport-frame" style={frameStyle}>
        <DecorLayers
          settings={settings}
          previewMode={previewMode}
          editDecor={editDecor}
          onAssetsChange={onDecorAssetsChange}
        />

        {showSakura && contentVisible && <SakuraAnimation />}

        <CoverSection
          settings={settings}
          eventName={data.event.name}
          eventDateLabel={formatEventDate(data.event.event_date)}
          guestName={data.guest.name}
          guestType={data.guest.guest_type}
          onOpen={handleOpenCover}
          style={coverStyle}
          isOpen={coverOpen}
          tagColor={theme.style.tagColor}
        />

        <div
          className={[
            'inv-content',
            contentVisible ? 'inv-animate-fade-in' : 'invisible h-0 overflow-hidden',
          ].join(' ')}
        >
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

          {sectionOrder.map((key) => {
            const customId = parseCustomSectionOrderKey(key)
            if (customId) {
              const custom = customById.get(customId)
              if (!custom || custom.enabled === false) return null
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
      </div>

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

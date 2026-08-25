import { describe, expect, it } from 'vitest'
import type { InvitationResponse } from './invitationTypes'
import {
  applySectionCustomPlaceholders,
  buildSectionCustomPayload,
  buildSectionCustomSrcdoc,
  isHttpsLibraryUrl,
  normalizeSectionCustomLibraries,
  patchSectionCustomSettings,
  resolveSectionCustomVisual,
  SECTION_CUSTOM_SANDBOX,
  sectionCustomStarterHtml,
} from './sectionCustom'
import { buildExistingSectionSeed } from './sectionCustomSeed'

const payload = buildSectionCustomPayload(
  {
    guest: {
      id: 1,
      name: 'Budi Santoso',
      guest_type: 'VIP',
      secret_token: 'secret-should-not-leak',
    },
    event: {
      id: 9,
      name: 'Raka & Sinta',
      event_date: '2026-12-01T10:00:00',
      location: 'Jakarta',
      couple_info: {
        groom: { full_name: 'Raka Putra', nickname: 'Raka' },
        bride: { full_name: 'Sinta Ayu', nickname: 'Sinta' },
        couple_initial: 'R & S',
      },
      invitation_settings: {
        cover_title: 'The Wedding',
        cover_subtitle: 'You are invited',
      },
      gallery: [{ id: 3, caption: 'Prewed', sort_order: 0, image_url: 'https://cdn.example/a.jpg' }],
      wishes: [
        {
          id: 1,
          guest_name: 'Ani',
          message: 'Selamat',
          rsvp_status: 'attending',
        },
      ],
    },
  } as InvitationResponse,
  { tagColor: '#c00', pageTextColor: '#111', fontFamily: 'serif' },
)

describe('isHttpsLibraryUrl', () => {
  it('accepts https CDN urls', () => {
    expect(
      isHttpsLibraryUrl('https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js'),
    ).toBe(true)
  })

  it('rejects http, javascript, and whitespace', () => {
    expect(isHttpsLibraryUrl('http://evil.example/x.js')).toBe(false)
    expect(isHttpsLibraryUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpsLibraryUrl('https://cdn.example/x.js foo')).toBe(false)
  })
})

describe('applySectionCustomPlaceholders', () => {
  it('fills guest aliases and escapes HTML in text placeholders', () => {
    const html = applySectionCustomPlaceholders(
      '<p>{{guest_name}} / {{nama_tamu}} {{guest_type}}</p>',
      {
        ...payload,
        guest: { name: 'A <b>B</b>', guest_type: 'VIP' },
      },
    )
    expect(html).toContain('A &lt;b&gt;B&lt;/b&gt;')
    expect(html).toContain('Tamu VIP')
    expect(html).not.toContain('<b>B</b>')
  })

  it('inserts raw JSON for gallery_json', () => {
    const html = applySectionCustomPlaceholders('{{gallery_json}}', payload)
    const parsed = JSON.parse(html) as Array<{ id: number; image_url: string }>
    expect(parsed[0]?.id).toBe(3)
    expect(parsed[0]?.image_url).toContain('cdn.example')
  })

  it('leaves unknown tokens unchanged', () => {
    expect(applySectionCustomPlaceholders('{{nope}}', payload)).toBe('{{nope}}')
  })
})

describe('buildSectionCustomPayload', () => {
  it('does not leak secrets and injects theme CSS variables', () => {
    expect(payload.guest).toEqual({ name: 'Budi Santoso', guest_type: 'VIP' })
    expect(JSON.stringify(payload)).not.toContain('secret-should-not-leak')
    const doc = buildSectionCustomSrcdoc({
      sectionKey: 'hero',
      html: '<p>x</p>',
      css: '',
      js: '',
      libraries: [],
      payload,
    })
    expect(doc).toContain('--inv-tag')
  })
})

describe('buildSectionCustomSrcdoc', () => {
  it('embeds substituted HTML and invitation bootstrap without allow-same-origin', () => {
    const doc = buildSectionCustomSrcdoc({
      sectionKey: 'cover',
      html: '<h1>{{event_name}}</h1>',
      css: 'h1{color:red}',
      js: 'window.__ran = true',
      libraries: [],
      payload,
    })
    expect(doc).toContain('Raka &amp; Sinta')
    expect(doc).toContain('window.invitation')
    expect(doc).toContain('"cover"')
    expect(doc.toLowerCase()).not.toContain('allow-same-origin')
    expect(SECTION_CUSTOM_SANDBOX.toLowerCase()).not.toContain('allow-same-origin')
  })

  it('keeps the iframe document transparent so page-level Desain Visual shows through', () => {
    const doc = buildSectionCustomSrcdoc({
      sectionKey: 'couple',
      html: '<section class="inv-section">ok</section>',
      css: '',
      js: '',
      libraries: [],
      payload,
    })
    expect(doc).toContain('id="inv-visual-root"')
    expect(doc).toMatch(/html,body\{[^}]*background:transparent/)
  })

  it('applies section Desain Visual: min-height, line-height, background, overlay', () => {
    const doc = buildSectionCustomSrcdoc({
      sectionKey: 'couple',
      html: '<section class="inv-section"><p>Mempelai</p></section>',
      css: '',
      js: '',
      libraries: [],
      payload,
      visual: {
        image_url: 'https://cdn.example/couple-bg.jpg',
        overlay: 0.4,
        min_height_px: 800,
        line_height: 1.6,
      },
    })
    expect(doc).toContain('min-height:800px')
    expect(doc).toContain('line-height:1.6')
    expect(doc).toContain('https://cdn.example/couple-bg.jpg')
    expect(doc).toContain('opacity:0.4')
    expect(doc).toContain('justify-content:center')
    expect(doc).toContain('class="inv-visual-content"')
    expect(doc).toContain('Mempelai')
  })

  it('hides seeded .bg-img/.bg-overlay when Visual Design supplies a section image', () => {
    const doc = buildSectionCustomSrcdoc({
      sectionKey: 'couple',
      html: '<img class="bg-img" src="https://old.example/stale.jpg" alt="">',
      css: '',
      js: '',
      libraries: [],
      payload,
      visual: { image_url: 'https://cdn.example/fresh.jpg', overlay: 0.2 },
    })
    expect(doc).toMatch(/\.bg-img,\s*\.bg-overlay\{display:none/)
    expect(doc).toContain('https://cdn.example/fresh.jpg')
  })

  it('escapes the visual background URL', () => {
    const doc = buildSectionCustomSrcdoc({
      sectionKey: 'hero',
      html: '<p>x</p>',
      css: '',
      js: '',
      libraries: [],
      payload,
      visual: { image_url: 'https://cdn.example/a.jpg"><script>alert(1)</script>' },
    })
    expect(doc).not.toContain('<script>alert(1)</script>')
    expect(doc).toContain('&quot;')
  })

  it('fills cover iframe to 100% height so cover min-height from Desain Visual can apply on the wrapper', () => {
    const doc = buildSectionCustomSrcdoc({
      sectionKey: 'cover',
      html: '<div class="cover-root">x</div>',
      css: '',
      js: '',
      libraries: [],
      payload,
      variant: 'cover',
      visual: { min_height_px: 640 },
    })
    expect(doc).toContain('height:100%')
    expect(doc).toContain('id="inv-visual-root"')
  })
})

describe('resolveSectionCustomVisual', () => {
  it('reads Desain Visual section_backgrounds for builtin keys', () => {
    const visual = resolveSectionCustomVisual(
      {
        section_backgrounds: {
          couple: {
            image_url: 'https://cdn.example/bg.jpg',
            overlay: 0.3,
            min_height_px: 640,
            line_height: 1.5,
          },
        },
      },
      'couple',
    )
    expect(visual?.image_url).toBe('https://cdn.example/bg.jpg')
    expect(visual?.min_height_px).toBe(640)
    expect(visual?.line_height).toBe(1.5)
  })

  it('ignores custom section keys that have no Desain Visual slot', () => {
    expect(
      resolveSectionCustomVisual(
        {
          section_backgrounds: {
            couple: { min_height_px: 400 },
          },
        },
        'custom:abc',
      ),
    ).toBeUndefined()
  })
})

describe('normalizeSectionCustomLibraries', () => {
  it('drops non-https sources', () => {
    const libs = normalizeSectionCustomLibraries([
      {
        id: 'bad',
        name: 'bad',
        src: 'http://example.com/a.js',
        kind: 'js',
      },
      {
        id: 'ok',
        name: 'ok',
        src: 'https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js',
        kind: 'js',
      },
    ])
    expect(libs).toHaveLength(1)
    expect(libs[0]?.id).toBe('ok')
  })
})

describe('sectionCustomStarterHtml', () => {
  it('includes invitation.open for cover only', () => {
    expect(sectionCustomStarterHtml('cover')).toContain('invitation.open()')
    expect(sectionCustomStarterHtml('couple')).not.toContain('onclick="invitation.open()"')
  })
})

describe('buildExistingSectionSeed', () => {
  it('mirrors cover existing layout with placeholders and open()', () => {
    const seed = buildExistingSectionSeed(
      'cover',
      { cover_subtitle: 'You are invited', cover_title: 'Wedding' },
      payload,
    )
    expect(seed.html).toContain('{{guest_name}}')
    expect(seed.html).toContain('{{event_name}}')
    expect(seed.html).toContain('invitation.open()')
    expect(seed.html).toContain('Buka Undangan')
  })

  it('mirrors couple existing cards with name placeholders', () => {
    const seed = buildExistingSectionSeed('couple', {}, payload)
    expect(seed.html).toContain('{{groom_name}}')
    expect(seed.html).toContain('{{bride_name}}')
    expect(seed.html).toContain('Mempelai Pria')
  })

  it('seeds gallery with current images and Splide library', () => {
    const seed = buildExistingSectionSeed('gallery', {}, payload)
    expect(seed.html).toContain('cdn.example')
    expect(seed.libraries.some((l) => l.src.includes('splide'))).toBe(true)
    expect(seed.js).toContain('new Splide')
  })
})

describe('patchSectionCustomSettings', () => {
  it('fills custom mode from existing section when html is empty', () => {
    const next = patchSectionCustomSettings(
      {},
      'cover',
      { mode: 'custom' },
      payload,
    )
    expect(next.section_custom?.cover?.mode).toBe('custom')
    expect(next.section_custom?.cover?.html).toContain('Buka Undangan')
    expect(next.section_custom?.cover?.html).toContain('{{guest_name}}')
  })
})




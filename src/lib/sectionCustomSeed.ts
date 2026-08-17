import {
  getSectionBackground,
  getSectionTitle,
  mergeGallerySlider,
  parseCustomSectionOrderKey,
  type BuiltinSectionKey,
  type InvitationSettings,
  type SectionBgKey,
  type SectionCustomCode,
  type SectionCustomLibrary,
} from './invitationTypes'
import type { SectionCustomPayload } from './sectionCustom'

const SPLIDE_LIBS: SectionCustomLibrary[] = [
  {
    id: 'splide-css',
    name: 'Splide CSS',
    src: 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4/dist/css/splide.min.css',
    kind: 'css',
  },
  {
    id: 'splide-js',
    name: 'Splide JS',
    src: 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4/dist/js/splide.min.js',
    kind: 'js',
  },
]

function esc(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const EXISTING_SECTION_BASE_CSS = `html, body {
  margin: 0;
  padding: 0;
  color: var(--inv-text, inherit);
  font-family: var(--inv-font, inherit);
}
img { max-width: 100%; height: auto; }
.inv-section { padding: 3rem 1.25rem; position: relative; text-align: center; }
.inv-section-title { font-size: 1.75rem; font-weight: 600; text-align: center; margin: 0 0 2rem; letter-spacing: 0.05em; color: var(--inv-tag); }
.inv-divider { width: 60px; height: 1px; margin: 1rem auto; background: currentColor; opacity: 0.3; }
.bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
.bg-overlay { position: absolute; inset: 0; background: #000; z-index: 1; pointer-events: none; }
.bg-content { position: relative; z-index: 2; }
.card { border-radius: 1rem; padding: 1.5rem; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); }
.person { margin: 2rem 0; }
.person-photo { width: 7rem; height: 7rem; border-radius: 9999px; object-fit: cover; margin: 1rem auto 0; display: block; box-shadow: 0 0 0 2px rgba(255,255,255,0.4); }
.person-name { font-family: serif; font-size: 1.5rem; margin: 1rem 0 0; color: var(--inv-tag); }
.amp { font-family: serif; font-size: 2rem; opacity: 0.4; margin: 0.5rem 0; }
.cover-root { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; position: relative; box-sizing: border-box; }
.cover-root .bg-img, .cover-root .bg-overlay { position: absolute; inset: 0; }
.cover-root .bg-img { object-fit: cover; width: 100%; height: 100%; }
.cover-kicker { font-size: 0.75rem; letter-spacing: 0.35em; text-transform: uppercase; }
.cover-title { font-family: serif; font-size: 2.25rem; font-weight: 600; margin: 1rem 0 0; color: var(--inv-tag); position: relative; z-index: 1; }
.cover-date, .cover-guest, .cover-type, .cover-brand { position: relative; z-index: 1; }
.inv-cover-btn { margin-top: 2rem; padding: 0.75rem 2rem; border-radius: 9999px; border: 1px solid currentColor; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); font-size: 0.875rem; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; position: relative; z-index: 1; }
.inv-countdown-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; max-width: 320px; margin: 1.5rem auto 0; }
.inv-countdown-item { text-align: center; padding: 0.75rem 0.5rem; border-radius: 0.75rem; background: rgba(255,255,255,0.2); }
.inv-countdown-value { font-size: 1.5rem; font-weight: 700; }
.inv-countdown-label { font-size: 0.65rem; margin-top: 0.25rem; opacity: 0.8; text-transform: uppercase; }
.inv-timeline { position: relative; padding-left: 1.5rem; max-width: 28rem; margin: 0 auto; text-align: left; }
.inv-timeline::before { content: ''; position: absolute; left: 0.35rem; top: 0.5rem; bottom: 0.5rem; width: 2px; background: currentColor; opacity: 0.2; }
.inv-timeline-item { position: relative; padding-bottom: 1.5rem; }
.inv-timeline-item::before { content: ''; position: absolute; left: -1.28rem; top: 0.4rem; width: 10px; height: 10px; border-radius: 50%; background: var(--inv-tag); }
.inv-wish-card { padding: 1rem; border-radius: 0.75rem; background: rgba(255,255,255,0.25); margin: 0 auto 0.75rem; max-width: 28rem; text-align: left; }
.inv-gallery-slide { margin: 0; height: 100%; }
.inv-gallery-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
.inv-gallery-slide figcaption { position: absolute; left: 0; right: 0; bottom: 0; padding: 0.5rem 0.75rem; font-size: 0.75rem; color: #fff; background: linear-gradient(transparent, rgba(0,0,0,0.55)); }
.map-btn { display: inline-block; margin-top: 1rem; border-radius: 9999px; border: 1px solid currentColor; padding: 0.4rem 1rem; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; color: inherit; }
.kicker { font-size: 0.7rem; letter-spacing: 0.3em; text-transform: uppercase; opacity: 0.7; }
.host-cols { display: flex; flex-direction: column; gap: 2rem; max-width: 32rem; margin: 0 auto; }
@media (min-width: 640px) { .host-cols { flex-direction: row; } }
.host-cols ol { text-align: left; padding-left: 1.25rem; }
`

function sectionShell(
  inner: string,
  settings: InvitationSettings,
  bgKey: SectionBgKey | null,
): string {
  const bg = bgKey ? getSectionBackground(settings, bgKey) : undefined
  const url = bg?.image_url?.trim()
  const overlay = bg?.overlay ?? 0.25
  const minH = bg?.min_height_px
  const minStyle =
    typeof minH === 'number' && minH > 0 ? ` min-height:${minH}px;` : ''
  if (!url) {
    return `<section class="inv-section" style="${minStyle}">${inner}</section>`
  }
  return `<section class="inv-section" style="${minStyle}">
  <img class="bg-img" src="${esc(url)}" alt="">
  ${overlay > 0 ? `<div class="bg-overlay" style="opacity:${Math.min(overlay, 0.85)}"></div>` : ''}
  <div class="bg-content">${inner}</div>
</section>`
}

function titleHtml(
  settings: InvitationSettings,
  key: BuiltinSectionKey,
): string {
  const t = getSectionTitle(settings, key)
  if (!t.show || !t.text.trim()) return ''
  return `<h2 class="inv-section-title">${esc(t.text)}</h2>`
}

function personHtml(
  side: 'groom' | 'bride',
  payload: SectionCustomPayload,
): string {
  const person = payload.couple[side]
  const label = side === 'groom' ? 'Mempelai Pria' : 'Mempelai Wanita'
  const nick = side === 'groom' ? '{{groom_nickname}}' : '{{bride_nickname}}'
  const full = side === 'groom' ? '{{groom_name}}' : '{{bride_name}}'
  const photo = person?.photo_url?.trim()
  const relation = side === 'groom' ? 'Putra' : 'Putri'
  const father = person?.father?.trim()
  const mother = person?.mother?.trim()
  const city = person?.city?.trim()
  return `<div class="person">
  <p class="kicker">${label}</p>
  ${photo ? `<img class="person-photo" src="${esc(photo)}" alt="">` : ''}
  <h3 class="person-name">${nick}</h3>
  <p>${full}</p>
  ${
    father || mother
      ? `<div style="margin-top:1rem;font-size:0.9rem;opacity:0.75"><p>${relation} dari ${esc(father)}</p>${mother ? `<p>&amp; ${esc(mother)}</p>` : ''}</div>`
      : ''
  }
  ${city ? `<p style="margin-top:0.5rem;font-size:0.75rem;opacity:0.6">${esc(city)}</p>` : ''}
</div>`
}

export function isGenericStarterHtml(html: string): boolean {
  return html.includes('Placeholder: {{guest_name}} {{nama_tamu}}')
}

export function buildExistingSectionSeed(
  sectionKey: string,
  settings: InvitationSettings,
  payload: SectionCustomPayload,
): Pick<SectionCustomCode, 'html' | 'css' | 'js' | 'libraries'> {
  const customId = parseCustomSectionOrderKey(sectionKey)
  if (customId) {
    const section = (settings.custom_sections ?? []).find((s) => s.id === customId)
    const title =
      section?.show_title !== false && section?.title
        ? `<h2 class="inv-section-title">${esc(section.title)}</h2>`
        : ''
    return {
      html: `<section class="inv-section">${title}${section?.content?.trim() || '<p></p>'}</section>`,
      css: EXISTING_SECTION_BASE_CSS,
      js: '',
      libraries: [],
    }
  }

  if (sectionKey === 'cover') {
    const bg = getSectionBackground(settings, 'cover')
    const url = bg?.image_url?.trim()
    const overlay = bg?.overlay ?? 0.25
    return {
      html: `<div class="cover-root">
  ${url ? `<img class="bg-img" src="${esc(url)}" alt="">` : ''}
  ${url && overlay > 0 ? `<div class="bg-overlay" style="opacity:${Math.min(overlay, 0.85)}"></div>` : ''}
  <p class="cover-kicker">{{cover_subtitle}}</p>
  <h1 class="cover-title">{{event_name}}</h1>
  <p class="cover-date" style="color:var(--inv-tag);opacity:0.85">{{event_date}}</p>
  <div class="cover-guest" style="margin-top:2rem">
    <p style="font-size:0.75rem;opacity:0.7">Kepada Yth. Bpk/Ibu/Saudara/i</p>
    <p style="font-family:serif;font-size:1.25rem;font-weight:600;color:var(--inv-tag);margin-top:0.5rem">{{guest_name}}</p>
    <p class="cover-type" style="font-size:0.75rem;opacity:0.6;color:var(--inv-tag)">{{guest_type}}</p>
  </div>
  <button type="button" class="inv-cover-btn" onclick="invitation.open()">Buka Undangan</button>
  <p class="cover-brand" style="margin-top:2rem;font-size:0.75rem;letter-spacing:0.2em;opacity:0.5">{{cover_title}}</p>
</div>`,
      css: `${EXISTING_SECTION_BASE_CSS}
html, body { height: 100%; }`,
      js: '',
      libraries: [],
    }
  }

  if (sectionKey === 'hero') {
    const initial = payload.couple.couple_initial?.trim()
    const countdown = settings.countdown_enabled !== false
    return {
      html: sectionShell(
        `<p class="kicker">We are getting married</p>
  <h1 class="cover-title">{{event_name}}</h1>
  <p style="color:var(--inv-tag);opacity:0.85">{{event_date}}</p>
  ${initial ? `<p style="font-family:serif;letter-spacing:0.3em;opacity:0.6;margin-top:1.5rem">-{{couple_initial}}-</p>` : ''}
  ${
    countdown
      ? `<p class="kicker" style="margin-top:2rem">Save the Date</p>
  <div class="inv-countdown-grid" id="countdown">
    <div class="inv-countdown-item"><div class="inv-countdown-value" data-unit="days">00</div><div class="inv-countdown-label">Hari</div></div>
    <div class="inv-countdown-item"><div class="inv-countdown-value" data-unit="hours">00</div><div class="inv-countdown-label">Jam</div></div>
    <div class="inv-countdown-item"><div class="inv-countdown-value" data-unit="minutes">00</div><div class="inv-countdown-label">Menit</div></div>
    <div class="inv-countdown-item"><div class="inv-countdown-value" data-unit="seconds">00</div><div class="inv-countdown-label">Detik</div></div>
  </div>`
      : ''
  }`,
        settings,
        'hero',
      ),
      css: EXISTING_SECTION_BASE_CSS,
      js: countdown
        ? `(function(){
  var root = document.getElementById('countdown');
  if (!root || !invitation.data.event.event_date) return;
  function pad(n){ return String(n).padStart(2,'0'); }
  function tick(){
    var diff = new Date(invitation.data.event.event_date).getTime() - Date.now();
    if (diff < 0) diff = 0;
    var map = {
      days: Math.floor(diff / 86400000),
      hours: Math.floor(diff / 3600000) % 24,
      minutes: Math.floor(diff / 60000) % 60,
      seconds: Math.floor(diff / 1000) % 60
    };
    root.querySelectorAll('[data-unit]').forEach(function(el){
      el.textContent = pad(map[el.getAttribute('data-unit')] || 0);
    });
  }
  tick();
  setInterval(tick, 1000);
})();`
        : '',
      libraries: [],
    }
  }

  if (sectionKey === 'couple') {
    const quote = payload.couple.opening_quote?.trim()
    return {
      html: sectionShell(
        `${titleHtml(settings, 'couple')}
  ${quote ? `<div class="invitation-quote" style="max-width:32rem;margin:0 auto 2rem;text-align:initial">${quote}</div>` : ''}
  ${personHtml('groom', payload)}
  <p class="amp">&amp;</p>
  ${personHtml('bride', payload)}`,
        settings,
        'couple',
      ),
      css: EXISTING_SECTION_BASE_CSS,
      js: '',
      libraries: [],
    }
  }

  if (sectionKey === 'schedule') {
    const items =
      (payload.schedules ?? []).length > 0
        ? payload.schedules ?? []
        : payload.event.event_date || payload.event.location
          ? [
              {
                title: 'Acara Utama',
                event_date: payload.event.event_date,
                start_time: null,
                end_time: null,
                venue: payload.event.location,
                address: null,
                maps_url: null,
              },
            ]
          : []
    const cards = items
      .map((item) => {
        const date = item.event_date ? esc(String(item.event_date)) : ''
        const time = [item.start_time, item.end_time].filter(Boolean).join(' – ')
        return `<div class="card" style="max-width:28rem;margin:0 auto 1.5rem">
    <h3 style="font-family:serif;font-size:1.25rem;color:var(--inv-tag)">${esc(item.title)}</h3>
    <div class="inv-divider"></div>
    ${date ? `<p style="color:var(--inv-tag)">${date}</p>` : ''}
    ${time ? `<p style="opacity:0.8">${esc(time)}</p>` : ''}
    ${item.venue ? `<p style="margin-top:0.75rem;font-weight:600;color:var(--inv-tag)">${esc(item.venue)}</p>` : ''}
    ${item.address ? `<p style="opacity:0.75">${esc(item.address)}</p>` : ''}
    ${item.maps_url ? `<a class="map-btn" href="${esc(item.maps_url)}">Buka Map</a>` : ''}
  </div>`
      })
      .join('\n')
    return {
      html: sectionShell(
        `${titleHtml(settings, 'schedule')}${cards || '<p>Belum ada jadwal.</p>'}`,
        settings,
        'schedule',
      ),
      css: EXISTING_SECTION_BASE_CSS,
      js: '',
      libraries: [],
    }
  }

  if (sectionKey === 'love_story') {
    const items = (payload.love_stories ?? [])
      .map(
        (story) => `<div class="inv-timeline-item">
    <h3 style="font-family:serif;color:var(--inv-tag)">${esc(story.title)}</h3>
    ${story.date_label ? `<p class="kicker" style="margin-top:0.25rem">${esc(story.date_label)}</p>` : ''}
    ${story.story ? `<p style="margin-top:0.5rem;font-size:0.9rem;opacity:0.85">${esc(story.story)}</p>` : ''}
  </div>`,
      )
      .join('\n')
    return {
      html: sectionShell(
        `${titleHtml(settings, 'love_story')}<div class="inv-timeline">${items || '<p>Belum ada cerita.</p>'}</div>`,
        settings,
        'love_story',
      ),
      css: EXISTING_SECTION_BASE_CSS,
      js: '',
      libraries: [],
    }
  }

  if (sectionKey === 'gallery') {
    const slider = mergeGallerySlider(settings.gallery_slider)
    const slides = (payload.gallery ?? [])
      .map(
        (img) => `<li class="splide__slide">
      <figure class="inv-gallery-slide">
        <img src="${esc(img.image_url)}" alt="${esc(img.caption ?? 'Galeri')}">
        ${img.caption?.trim() ? `<figcaption>${esc(img.caption)}</figcaption>` : ''}
      </figure>
    </li>`,
      )
      .join('\n')
    return {
      html: sectionShell(
        `${titleHtml(settings, 'gallery')}
  <div class="splide inv-gallery-splide" style="max-width:32rem;margin:0 auto">
    <div class="splide__track"><ul class="splide__list">
      ${slides || '<li class="splide__slide"><p>Belum ada foto.</p></li>'}
    </ul></div>
  </div>`,
        settings,
        'gallery',
      ),
      css: `${EXISTING_SECTION_BASE_CSS}
.splide { margin: 0 auto; }`,
      js: `if (window.Splide) {
  new Splide('.splide', {
    type: ${JSON.stringify(slider.type)},
    rewind: ${slider.rewind ? 'true' : 'false'},
    autoplay: ${slider.autoplay ? 'true' : 'false'},
    interval: ${slider.interval_ms},
    pauseOnHover: ${slider.pause_on_hover ? 'true' : 'false'},
    arrows: ${slider.arrows ? 'true' : 'false'},
    pagination: false,
    perPage: ${slider.type === 'fade' ? 1 : slider.per_page},
    gap: '${slider.gap_px}px',
    height: '${slider.height_px}px',
    cover: true
  }).mount();
}`,
      libraries: SPLIDE_LIBS,
    }
  }

  if (sectionKey === 'wishes') {
    const cards = (payload.wishes ?? [])
      .map(
        (w) => `<div class="inv-wish-card">
    <p style="font-weight:600;color:var(--inv-tag)">${esc(w.guest_name)}</p>
    <p style="margin-top:0.25rem;font-size:0.9rem;opacity:0.85">${esc(w.message)}</p>
  </div>`,
      )
      .join('\n')
    return {
      html: sectionShell(
        `${titleHtml(settings, 'wishes')}
  <div id="wish-list">${cards}</div>
  <p style="max-width:28rem;margin:2rem auto 0;font-size:0.9rem;font-style:italic;opacity:0.75">Atas doa &amp; ucapan Bapak/Ibu/Saudara/i, kami mengucapkan terima kasih.</p>`,
        settings,
        'wishes',
      ),
      css: EXISTING_SECTION_BASE_CSS,
      js: `(function(){
  var list = document.getElementById('wish-list');
  var wishes = (invitation.data && invitation.data.wishes) || [];
  if (!list || !wishes.length) return;
  list.innerHTML = wishes.map(function(w){
    return '<div class="inv-wish-card"><p style="font-weight:600;color:var(--inv-tag)">'+String(w.guest_name||'')+'</p><p style="margin-top:0.25rem;font-size:0.9rem;opacity:0.85">'+String(w.message||'')+'</p></div>';
  }).join('');
})();`,
      libraries: [],
    }
  }

  if (sectionKey === 'hosts') {
    const groom = (payload.hosts.groom_side ?? [])
      .map((n, i) => `<li>${i + 1}. ${esc(n)}</li>`)
      .join('')
    const bride = (payload.hosts.bride_side ?? [])
      .map((n, i) => `<li>${i + 1}. ${esc(n)}</li>`)
      .join('')
    return {
      html: sectionShell(
        `${titleHtml(settings, 'hosts')}
  <div class="host-cols">
    ${groom ? `<div><h3 style="font-family:serif">Kel. Mempelai Pria</h3><ol>${groom}</ol></div>` : ''}
    ${bride ? `<div><h3 style="font-family:serif">Kel. Mempelai Wanita</h3><ol>${bride}</ol></div>` : ''}
  </div>`,
        settings,
        'hosts',
      ),
      css: EXISTING_SECTION_BASE_CSS,
      js: '',
      libraries: [],
    }
  }

  return {
    html: `<section class="inv-section">
  <h1>{{event_name}}</h1>
  <p>Kepada Yth. {{guest_name}}</p>
</section>
`,
    css: EXISTING_SECTION_BASE_CSS,
    js: '',
    libraries: [],
  }
}

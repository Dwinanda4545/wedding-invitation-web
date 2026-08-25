import CodeMirror from '@uiw/react-codemirror'
import { css as cssLang } from '@codemirror/lang-css'
import { html as htmlLang } from '@codemirror/lang-html'
import { javascript as javascriptLang } from '@codemirror/lang-javascript'
import { useMemo, useState } from 'react'
import { CustomSectionFrame } from '../../components/invitation/CustomSectionFrame'
import type {
  InvitationResponse,
  InvitationSettings,
  SectionCustomLibrary,
} from '../../lib/invitationTypes'
import { getSectionCustom, isSectionCustomMode } from '../../lib/invitationTypes'
import {
  buildSectionCustomPayload,
  isHttpsLibraryUrl,
  patchSectionCustomSettings,
  SECTION_CUSTOM_LIBRARY_PRESETS,
  type SectionCustomThemeBits,
} from '../../lib/sectionCustom'

type Tab = 'html' | 'css' | 'js' | 'libraries'

type Props = {
  sectionKey: string
  label: string
  settings: InvitationSettings
  onSettingsChange: (settings: InvitationSettings) => void
  data: InvitationResponse
  theme: SectionCustomThemeBits
  children?: React.ReactNode
}

export function SectionCustomCodeEditor({
  sectionKey,
  label,
  settings,
  onSettingsChange,
  data,
  theme,
  children,
}: Props) {
  const [tab, setTab] = useState<Tab>('html')
  const [frameError, setFrameError] = useState<string | null>(null)
  const [customSrc, setCustomSrc] = useState('')
  const [customName, setCustomName] = useState('')
  const [customKind, setCustomKind] = useState<'js' | 'css'>('js')
  const [libError, setLibError] = useState<string | null>(null)

  const code = getSectionCustom(settings, sectionKey)
  const custom = isSectionCustomMode(settings, sectionKey)
  const payload = useMemo(
    () => buildSectionCustomPayload(data, theme),
    [data, theme],
  )

  function patch(next: Parameters<typeof patchSectionCustomSettings>[2]) {
    setFrameError(null)
    onSettingsChange(
      patchSectionCustomSettings(settings, sectionKey, next, payload),
    )
  }

  const extensions = useMemo(() => {
    if (tab === 'css') return [cssLang()]
    if (tab === 'js') return [javascriptLang()]
    return [htmlLang()]
  }, [tab])

  function togglePreset(preset: SectionCustomLibrary) {
    const exists = code.libraries.some((l) => l.src === preset.src)
    patch({
      libraries: exists
        ? code.libraries.filter((l) => l.src !== preset.src)
        : [...code.libraries, { ...preset }],
    })
  }

  function addCustomLibrary() {
    setLibError(null)
    if (!isHttpsLibraryUrl(customSrc)) {
      setLibError('URL library harus HTTPS (https://...), tanpa spasi.')
      return
    }
    if (code.libraries.some((l) => l.src === customSrc.trim())) {
      setLibError('Library ini sudah ditambahkan.')
      return
    }
    patch({
      libraries: [
        ...code.libraries,
        {
          id: `custom_${Date.now()}`,
          name: customName.trim() || customSrc.trim(),
          src: customSrc.trim(),
          kind: customKind,
        },
      ],
    })
    setCustomSrc('')
    setCustomName('')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-stone-600">Mode {label}</p>
        <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
          <button
            type="button"
            className={[
              'rounded-md px-3 py-1 font-medium',
              !custom ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500',
            ].join(' ')}
            onClick={() => patch({ mode: 'existing' })}
          >
            Existing
          </button>
          <button
            type="button"
            className={[
              'rounded-md px-3 py-1 font-medium',
              custom ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500',
            ].join(' ')}
            onClick={() => patch({ mode: 'custom' })}
          >
            Custom code
          </button>
        </div>
      </div>

      {!custom && children}

      {custom && (
        <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-3">
          <p className="text-[11px] text-stone-500">
            HTML/CSS/JS jalan di iframe terisolasi. Placeholder:{' '}
            <code className="rounded bg-stone-100 px-1">{'{{guest_name}}'}</code>,{' '}
            <code className="rounded bg-stone-100 px-1">{'{{groom_name}}'}</code>,{' '}
            <code className="rounded bg-stone-100 px-1">{'{{gallery_json}}'}</code>.
            JS memakai <code className="rounded bg-stone-100 px-1">invitation.data</code>
            {sectionKey === 'cover' ? (
              <>
                . Cover: <code className="rounded bg-stone-100 px-1">invitation.open()</code>
              </>
            ) : null}
          </p>

          <div className="flex flex-wrap gap-1">
            {(['html', 'css', 'js', 'libraries'] as Tab[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={[
                  'rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                  tab === id
                    ? 'bg-rose-100 text-rose-900'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                ].join(' ')}
              >
                {id === 'libraries' ? 'Libraries' : id.toUpperCase()}
              </button>
            ))}
          </div>

          {tab !== 'libraries' ? (
            <CodeMirror
              value={tab === 'html' ? code.html : tab === 'css' ? code.css : code.js}
              height="260px"
              extensions={extensions}
              onChange={(value) => {
                if (tab === 'html') patch({ html: value })
                else if (tab === 'css') patch({ css: value })
                else patch({ js: value })
              }}
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {SECTION_CUSTOM_LIBRARY_PRESETS.map((preset) => {
                  const on = code.libraries.some((l) => l.src === preset.src)
                  return (
                    <label
                      key={preset.id}
                      className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => togglePreset(preset)}
                      />
                      <span>
                        {preset.name}{' '}
                        <span className="text-stone-400">({preset.kind})</span>
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_140px_80px_auto]">
                <input
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs"
                  placeholder="https://cdn.example/plugin.js"
                  value={customSrc}
                  onChange={(e) => setCustomSrc(e.target.value)}
                />
                <input
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs"
                  placeholder="Nama"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <select
                  className="rounded-lg border border-stone-200 px-2 py-2 text-xs"
                  value={customKind}
                  onChange={(e) => setCustomKind(e.target.value as 'js' | 'css')}
                >
                  <option value="js">JS</option>
                  <option value="css">CSS</option>
                </select>
                <button
                  type="button"
                  onClick={addCustomLibrary}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800"
                >
                  Tambah
                </button>
              </div>
              {libError && <p className="text-xs text-red-600">{libError}</p>}
              {code.libraries.filter(
                (l) => !SECTION_CUSTOM_LIBRARY_PRESETS.some((p) => p.src === l.src),
              ).length > 0 && (
                <ul className="space-y-1 text-xs text-stone-600">
                  {code.libraries
                    .filter(
                      (l) =>
                        !SECTION_CUSTOM_LIBRARY_PRESETS.some((p) => p.src === l.src),
                    )
                    .map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center justify-between gap-2 rounded border border-stone-100 bg-stone-50 px-2 py-1"
                      >
                        <span className="truncate">
                          {l.name} — {l.src}
                        </span>
                        <button
                          type="button"
                          className="text-red-600"
                          onClick={() =>
                            patch({
                              libraries: code.libraries.filter((x) => x.src !== l.src),
                            })
                          }
                        >
                          Hapus
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
              Pratinjau section
            </p>
            <div
              className="overflow-hidden rounded-lg border border-stone-200"
              style={{
                background: theme.pageBackground?.trim() || 'transparent',
                color: theme.pageTextColor,
                fontFamily: theme.fontFamily,
              }}
            >
              <CustomSectionFrame
                sectionKey={sectionKey}
                code={code}
                data={data}
                theme={theme}
                settings={settings}
                variant={sectionKey === 'cover' ? 'cover' : 'content'}
                isOpen={false}
                previewEmbed
                coverStyle={undefined}
                onError={setFrameError}
              />
            </div>
            {frameError && (
              <p className="mt-1 text-xs text-red-600">Error JS: {frameError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

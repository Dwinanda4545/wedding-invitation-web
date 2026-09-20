import { useMemo, useState, type ReactNode } from 'react'

export type SortDir = 'asc' | 'desc'

type Options<T> = {
  searchText: (row: T) => string
  sortValue: (row: T, key: string) => string | number
  initialSortKey?: string
  pageSize?: number
}

export function useAdminDataTable<T>(rows: T[], options: Options<T>) {
  const [query, setQuery] = useState('')
  const [pageSize, setPageSize] = useState(options.pageSize ?? 10)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState(options.initialSortKey ?? '')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => options.searchText(row).toLowerCase().includes(needle))
  }, [rows, query, options])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = options.sortValue(a, sortKey)
      const bv = options.sortValue(b, sortKey)
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'id', { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir, options])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const start = sorted.length === 0 ? 0 : (safePage - 1) * pageSize
  const pageRows = sorted.slice(start, start + pageSize)

  function changeQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  function changePageSize(value: number) {
    setPageSize(value)
    setPage(1)
  }

  function toggleSort(key: string) {
    setPage(1)
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
      return
    }
    setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
  }

  return {
    query,
    setQuery: changeQuery,
    pageSize,
    setPageSize: changePageSize,
    page: safePage,
    setPage,
    pageCount,
    pageRows,
    filtered,
    filteredCount: sorted.length,
    totalCount: rows.length,
    from: sorted.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, sorted.length),
    sortKey,
    sortDir,
    toggleSort,
  }
}

export function DataTableToolbar({
  query,
  onQueryChange,
  pageSize,
  onPageSizeChange,
  placeholder = 'Cari…',
}: {
  query: string
  onQueryChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
      <label className="flex items-center gap-2 text-sm text-stone-600">
        Tampilkan
        <select
          className="rounded-lg border border-stone-200 px-2 py-1 text-sm text-stone-800"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        baris
      </label>
      <label className="flex items-center gap-2 text-sm text-stone-600">
        Cari
        <input
          className="w-48 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-900 outline-none ring-rose-200 focus:ring-2 sm:w-64"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
        />
      </label>
    </div>
  )
}

export function DataTableFooter({
  from,
  to,
  filteredCount,
  totalCount,
  page,
  pageCount,
  onPageChange,
}: {
  from: number
  to: number
  filteredCount: number
  totalCount: number
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-3 text-sm text-stone-600">
      <p>
        Menampilkan {from}–{to} dari {filteredCount}
        {filteredCount !== totalCount ? ` (difilter dari ${totalCount})` : ''} data
      </p>
      <div className="flex items-center gap-1">
        <PagerButton disabled={page <= 1} onClick={() => onPageChange(1)}>
          «
        </PagerButton>
        <PagerButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ‹
        </PagerButton>
        <span className="px-2 text-stone-800">
          {page} / {pageCount}
        </span>
        <PagerButton disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          ›
        </PagerButton>
        <PagerButton disabled={page >= pageCount} onClick={() => onPageChange(pageCount)}>
          »
        </PagerButton>
      </div>
    </div>
  )
}

function PagerButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-stone-200 px-2 py-1 text-stone-700 hover:bg-stone-50 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function SortableTh({
  label,
  active,
  dir,
  onClick,
  className = '',
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
}) {
  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        type="button"
        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-stone-800"
        onClick={onClick}
      >
        {label}
        <span className="text-[10px] text-stone-400">
          {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  )
}

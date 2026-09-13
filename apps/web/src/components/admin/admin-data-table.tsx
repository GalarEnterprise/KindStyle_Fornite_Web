'use client'

import { useState } from 'react'

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface AdminDataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  total?: number
  page?: number
  limit?: number
  onPageChange?: (page: number) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  filters?: React.ReactNode
  actions?: (item: T) => React.ReactNode
  emptyMessage?: string
  keyExtractor: (item: T) => string
}

export function AdminDataTable<T>({
  columns,
  data,
  total = 0,
  page = 1,
  limit = 20,
  onPageChange,
  onSort,
  filters,
  actions,
  emptyMessage = 'No hay datos',
  keyExtractor,
}: AdminDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const totalPages = Math.ceil(total / limit)

  function handleSort(key: string) {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  return (
    <div>
      {filters && <div className="mb-4">{filters}</div>}

      <div className="overflow-x-auto rounded-lg border border-purple-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-purple-800 bg-purple-900">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-purple-300 ${
                    col.sortable ? 'cursor-pointer hover:text-white' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-medium text-purple-300">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-purple-400/70">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="border-b border-purple-800 hover:bg-purple-900/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-purple-100">
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">{actions(item)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-purple-300">
            {total} resultados — Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="rounded border border-purple-700 px-3 py-1 text-sm text-purple-200 hover:bg-purple-900 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-purple-700 px-3 py-1 text-sm text-purple-200 hover:bg-purple-900 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

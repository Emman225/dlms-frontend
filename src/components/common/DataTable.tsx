import React, { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react'

export type Column<T> = {
  key: keyof T | string
  title: React.ReactNode
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => React.ReactNode
}

export type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  pageSizes?: number[]
  actions?: (row: T) => React.ReactNode
  title?: string
}

// Memoized row component to prevent unnecessary re-renders
const DataTableRow = React.memo(function DataTableRow({
  row,
  columns,
  actions,
  index
}: {
  row: any,
  columns: Column<any>[],
  actions?: (row: any) => React.ReactNode,
  index: number
}) {
  return (
    <tr>
      {columns.map((c, idx) => (
        <td key={`${index}-${idx}`} className={c.align === 'center' ? 'text-center' : c.align === 'right' ? 'text-end' : undefined}>
          {c.render ? c.render(row) : String(row[c.key as any] ?? '—')}
        </td>
      ))}
      {actions && (
        <td className="text-center">
          <div className="btn-group-premium">
            {actions(row)}
          </div>
        </td>
      )}
    </tr>
  )
})

export default function DataTable<T extends Record<string, any>>({ columns, rows, loading, pageSizes = [10, 20, 50], actions, title }: DataTableProps<T>) {
  const [q, setQ] = useState('')
  const deferredQ = useDeferredValue(q) // Defer search to keep typing smooth
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizes[0])
  const tableRef = useRef<HTMLTableElement | null>(null)

  useEffect(() => {
    setPage(1)
  }, [deferredQ, pageSize])

  const filtered = useMemo(() => {
    if (!deferredQ) return rows
    const query = deferredQ.toLowerCase()
    return rows.filter((r) => {
      // Optimized search: only check string/number values
      return Object.entries(r).some(([, val]) => {
        if (val === null || val === undefined) return false
        if (typeof val === 'object') return false // Skip complex objects for performance
        return String(val).toLowerCase().includes(query)
      })
    })
  }, [rows, deferredQ])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const current = useMemo(() => filtered.slice(start, start + pageSize), [filtered, start, pageSize])

  const exportCSV = () => {
    const header = columns.map((c) => c.title)
    const dataRows = filtered.map((r) => columns.map((c) => {
      const val = c.render ? c.render(r) : r[c.key as any]
      const text = typeof val === 'string' || typeof val === 'number' ? String(val) : ''
      return `"${text.replace(/"/g, '""')}"`
    }))
    const csv = [header.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','), ...dataRows.map((rr) => rr.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || 'export').replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const table = tableRef.current
    if (!table) return exportCSV()
    const html = table.outerHTML
    const blob = new Blob([`\uFEFF${html}`], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || 'export').replace(/\s+/g, '_')}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const table = tableRef.current
    const win = window.open('', '_blank')
    if (!win || !table) return
    const styles = '<style>table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:6px;font-size:12px} th{background:#f3f4f6;text-align:left}</style>'
    win.document.write(`<html><head><title>${title || 'Export'}</title>${styles}</head><body>${table.outerHTML}</body></html>`) // eslint-disable-line
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="datatable-wrapper">
      <div className="d-flex flex-column flex-md-row gap-3 justify-content-between align-items-md-center mb-4">
        <div className="search-box position-relative" style={{ minWidth: '320px' }}>
          <i className="fa-solid fa-magnifying-glass position-absolute top-50 start-0 translate-middle-y ms-3 text-primary opacity-50"></i>
          <input
            className="form-control ps-5 py-2 border-0 shadow-sm"
            style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            placeholder="Rechercher dans la liste..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="d-flex gap-2">
          <div className="dropdown">
            <button className="btn btn-alt-secondary btn-sm dropdown-toggle shadow-sm px-3" type="button" id="dropdownExport" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="fa-solid fa-download me-2"></i>Exporter
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" aria-labelledby="dropdownExport">
              <li><button className="dropdown-item py-2" onClick={exportCSV}><i className="fa-solid fa-file-csv me-2 text-info"></i> Format CSV</button></li>
              <li><button className="dropdown-item py-2" onClick={exportExcel}><i className="fa-solid fa-file-excel me-2 text-success"></i> Format Excel</button></li>
              <li><button className="dropdown-item py-2" onClick={exportPDF}><i className="fa-solid fa-file-pdf me-2 text-danger"></i> Format PDF</button></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-striped table-vcenter" ref={tableRef}>
          <thead>
            <tr>
              {columns.map((c, idx) => (
                <th key={idx} style={{ width: c.width }} className={c.align === 'center' ? 'text-center' : c.align === 'right' ? 'text-end' : undefined}>
                  {c.title}
                </th>
              ))}
              {actions && <th style={{ width: 120 }} className="text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={(columns.length + (actions ? 1 : 0))} className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </td></tr>
            ) : current.length ? current.map((r, i) => (
              <DataTableRow
                key={r.id || r.idCompteur || i}
                row={r}
                columns={columns}
                actions={actions}
                index={i}
              />
            )) : (
              <tr><td colSpan={(columns.length + (actions ? 1 : 0))} className="text-center py-4 text-muted">Aucune donnée trouvée</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-2">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Affichage</span>
          <select className="form-select form-select-sm" style={{ width: 90 }} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {pageSizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-muted small">sur {total}</span>
        </div>
        <div className="d-flex gap-1">
          <button className="btn btn-sm btn-alt-secondary" disabled={page <= 1} onClick={() => setPage(1)}><i className="fa-solid fa-angles-left"></i></button>
          <button className="btn btn-sm btn-alt-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><i className="fa-solid fa-angle-left"></i></button>
          <div className="d-flex align-items-center px-3 bg-light rounded-pill mx-1">
            <span className="fw-bold text-primary small">{page}</span>
            <span className="text-muted small mx-1">/</span>
            <span className="text-muted small">{pageCount}</span>
          </div>
          <button className="btn btn-sm btn-alt-secondary" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}><i className="fa-solid fa-angle-right"></i></button>
          <button className="btn btn-sm btn-alt-secondary" disabled={page >= pageCount} onClick={() => setPage(pageCount)}><i className="fa-solid fa-angles-right"></i></button>
        </div>
      </div>
    </div>
  )
}

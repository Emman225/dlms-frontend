import MainLayout from '../layouts/MainLayout'
import { useEffect, useMemo, useState } from 'react'
import { typeCommandeService } from '../services/typeCommandeService'
import DataTable, { type Column } from '../components/common/DataTable'

export default function TypeCommandesList() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ; (async () => {
      setLoading(true)
      try {
        const res = await typeCommandeService.list()
        const payload = (res?.data as any) || {}
        const items = Array.isArray(payload) ? payload : (payload?.data ?? [])
        setRows(items)
      } catch (_) {
        setRows([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const columns = useMemo<Column<any>[]>(() => [
    { key: 'id', title: 'ID', width: 80, align: 'center' },
    { key: 'libelletype', title: 'Libellé', render: (t) => <span className="fw-semibold">{t.libelletype ?? '—'}</span> },
  ], [])

  return (
    <MainLayout>
      <div className="content content-full">
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">Liste types de commandes</h3>
          </div>
          <div className="block-content block-content-full">
            <DataTable
              title="Types de commandes"
              columns={columns}
              rows={rows}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { fabricantService } from '../services/fabricantService'
import DataTable, { type Column } from '../components/common/DataTable'
import FabricantModal, { type FabricantFormValues } from '../components/fabricants/FabricantModal'
import { fabricantApi, type Fabricant } from '../api/fabricantApi'
import { authService } from '../services/authService'
import { usePermissions } from '../context/PermissionContext'

export default function FabricantsList() {
  const { hasPermission } = usePermissions()
  const [rows, setRows] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Fabricant | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await fabricantService.list()
      const data = (res?.data as any) || []
      const items = Array.isArray(data) ? data : (data?.data ?? [])
      setRows(items)
    } catch (_) {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ; (async () => {
      await loadList()
      try {
        const me = await authService.me()
        const u = (me?.data as any)?.data ?? me?.data
        const id = u?.id ?? u?.userId ?? null
        if (id != null) setUserId(Number(id))
      } catch (_) { }
    })()
  }, [])

  const onNew = () => { setEditing(null); setShowModal(true) }
  const onEdit = (f: Fabricant) => { setEditing(f); setShowModal(true) }
  const onDelete = async (f: Fabricant) => {
    const ask = (window as any).Swal
    const confirm = ask
      ? await ask.fire({ icon: 'warning', title: 'Supprimer ce fabricant ?', text: f.libelle, showCancelButton: true, confirmButtonText: 'Oui, supprimer' })
      : { isConfirmed: window.confirm(`Supprimer le fabricant « ${f.libelle} » ?`) }
    if (!confirm.isConfirmed) return
    try {
      setSubmitting(true)
      await fabricantApi.remove({ id: f.id, deletedBy: String(userId ?? '') })

      // OPTIMIZATION: Update local state
      setRows(prev => prev.filter(row => row.id !== f.id))

      ask && ask.fire({ icon: 'success', title: 'Supprimé', timer: 1200, showConfirmButton: false })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur lors de la suppression'
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (values: FabricantFormValues) => {
    try {
      setSubmitting(true)
      if (editing?.id) {
        const payload = { id: editing.id, libelle: values.libelle, updatedBy: String(userId ?? '') };
        await fabricantApi.edit(payload)

        // OPTIMIZATION: Update local state
        setRows(prev => prev.map(row => row.id === editing.id ? { ...row, ...payload } : row))
      } else {
        const res = await fabricantApi.add({ libelle: values.libelle, createdBy: String(userId ?? '') })

        // OPTIMIZATION: Add to local state
        if (res && res.data) {
          setRows(prev => [res.data, ...prev])
        } else {
          await loadList()
        }
      }
      setShowModal(false)
      setEditing(null)
      const ask = (window as any).Swal
      ask && ask.fire({ icon: 'success', title: 'Enregistré', timer: 1200, showConfirmButton: false })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur lors de l\'enregistrement'
      const ask = (window as any).Swal
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo<Column<any>[]>(() => [
    { key: 'id', title: 'ID', width: 80, align: 'center' },
    { key: 'libelle', title: 'Libellé', render: (r) => <span className="fw-semibold fs-sm">{r.libelle ?? '—'}</span> },
  ], [])

  return (
    <MainLayout>
      <div className="content content-full">
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">Liste fabricants</h3>
            <div className="block-options">
              {hasPermission('Créer un fabricant') && (
                <button className="btn btn-sm btn-success" onClick={onNew}>
                  <i className="fa-solid fa-plus me-1"></i> Nouveau
                </button>
              )}
            </div>
          </div>
          <div className="block-content block-content-full">
            <DataTable
              title="Fabricants"
              columns={columns}
              rows={rows}
              loading={loading}
              actions={(f: any) => (
                <>
                  {hasPermission('Modifier un fabricant') && (
                    <button className="btn btn-sm btn-alt-secondary" onClick={() => onEdit(f)} title="Editer">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  )}
                  {hasPermission('Supprimer un fabricant') && (
                    <button className="btn btn-sm btn-alt-danger" onClick={() => onDelete(f)} disabled={submitting} title="Supprimer">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </>
              )}
            />
          </div>
        </div>
      </div>
      <FabricantModal
        show={showModal}
        onClose={() => { if (!submitting) { setShowModal(false); setEditing(null) } }}
        onSubmit={handleSubmit}
        initial={editing ?? undefined}
        submitting={submitting}
      />
    </MainLayout>
  )
}

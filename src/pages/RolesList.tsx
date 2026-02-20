import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import DataTable, { type Column } from '../components/common/DataTable'
import RoleModal, { type RoleFormValues } from '../components/roles/RoleModal'
import { roleService } from '../services/roleService'
import { roleApi, type Role } from '../api/roleApi'
import { authService } from '../services/authService'
import { usePermissions } from '../context/PermissionContext'
import RolePermissionModal from '../components/roles/RolePermissionModal'

export default function RolesList() {
  const { hasPermission } = usePermissions()
  const [rows, setRows] = useState<Array<Role>>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string>('')

  // Permission management state
  const [permissionRole, setPermissionRole] = useState<Role | null>(null)
  const [showPermissionModal, setShowPermissionModal] = useState(false)

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await roleService.list()
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
        const me = await authService.getCurrent()
        const u = (me?.data as any)?.data ?? me?.data
        const id = u?.id ?? u?.userId ?? ''
        setUserId(String(id))
      } catch (_) { }
    })()
  }, [])

  const onNew = () => { setEditing(null); setShowModal(true) }
  const onEdit = (r: Role) => { setEditing(r); setShowModal(true) }
  const onManagePermissions = (r: Role) => {
    setPermissionRole(r)
    setShowPermissionModal(true)
  }
  const onDelete = async (r: Role) => {
    const ask = (window as any).Swal
    const confirm = ask
      ? await ask.fire({ icon: 'warning', title: 'Supprimer ce rôle ?', text: r.libelle, showCancelButton: true, confirmButtonText: 'Oui, supprimer' })
      : { isConfirmed: window.confirm(`Supprimer le rôle « ${r.libelle} » ?`) }
    if (!confirm.isConfirmed) return
    try {
      setSubmitting(true)
      await roleApi.remove({ id: r.id, deletedBy: String(userId) } as any)

      // OPTIMIZATION: Update local state
      setRows(prev => prev.filter(row => row.id !== r.id))

      ask && ask.fire({ icon: 'success', title: 'Supprimé', timer: 1200, showConfirmButton: false })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la suppression'
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (values: RoleFormValues) => {
    try {
      setSubmitting(true)
      if (editing?.id) {
        const payload = { id: editing.id, ...values, updatedBy: String(userId) };
        await roleApi.edit(payload as any)

        // OPTIMIZATION: Update local state
        setRows(prev => prev.map(row => row.id === editing.id ? { ...row, ...values } : row))
      } else {
        const res = await roleApi.add({ ...values, createdBy: String(userId) } as any)

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
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de l\'enregistrement'
      const ask = (window as any).Swal
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo<Column<Role>[]>(() => [
    { key: 'libelle', title: 'Libellé', render: (r) => <span className="fw-semibold fs-sm">{r.libelle ?? '—'}</span> },
    { key: 'code', title: 'Code' },
    { key: 'description', title: 'Description' },
  ], [])

  return (
    <MainLayout>
      <div className="content content-full">
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">Liste rôles</h3>
            <div className="block-options">
              {hasPermission('Créer un rôle') && (
                <button className="btn btn-sm btn-success" onClick={onNew}>
                  <i className="fa-solid fa-plus me-1"></i> Nouveau
                </button>
              )}
            </div>
          </div>
          <div className="block-content block-content-full">
            <DataTable
              title="Rôles"
              columns={columns}
              rows={rows}
              loading={loading}
              actions={(r: Role) => (
                <>
                  {hasPermission('Modifier un rôle') && (
                    <button className="btn btn-sm btn-alt-secondary" onClick={() => onEdit(r)} title="Editer">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  )}
                  {hasPermission('Voir les permissions') && (
                    <button className="btn btn-sm btn-alt-info" onClick={() => onManagePermissions(r)} title="Gérer les permissions">
                      <i className="fa-solid fa-shield-halved"></i>
                    </button>
                  )}
                  {hasPermission('Supprimer un rôle') && (
                    <button className="btn btn-sm btn-alt-danger" onClick={() => onDelete(r)} disabled={submitting} title="Supprimer">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </>
              )}
            />
          </div>
        </div>
      </div>
      <RoleModal
        show={showModal}
        onClose={() => { if (!submitting) { setShowModal(false); setEditing(null) } }}
        onSubmit={handleSubmit}
        initial={editing ?? undefined}
        submitting={submitting}
      />

      <RolePermissionModal
        show={showPermissionModal}
        onClose={() => { setShowPermissionModal(false); setPermissionRole(null) }}
        roleId={permissionRole?.id || ''}
        roleLabel={permissionRole?.libelle || ''}
      />
    </MainLayout>
  )
}

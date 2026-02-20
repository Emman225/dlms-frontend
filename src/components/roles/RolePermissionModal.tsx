import { useEffect, useState } from 'react'
import { permissionApi, type Permission } from '../../api/permissionApi'
import { usePermissions } from '../../context/PermissionContext'

export default function RolePermissionModal({
    show,
    onClose,
    roleId,
    roleLabel,
}: {
    show: boolean
    onClose: () => void
    roleId: string
    roleLabel: string
}) {
    const { refreshPermissions } = usePermissions()
    const [allPermissions, setAllPermissions] = useState<Permission[]>([])
    const [rolePermissions, setRolePermissions] = useState<Permission[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (show && roleId) {
            loadData()
        }
    }, [show, roleId])

    const loadData = async () => {
        setLoading(true)
        try {
            const [allRes, roleRes] = await Promise.all([
                permissionApi.list(),
                permissionApi.getByRoleId(roleId)
            ])

            const all = allRes.isSuccess ? allRes.data : []
            const current = roleRes.isSuccess ? roleRes.data : []

            setAllPermissions(all)
            setRolePermissions(current)
            setSelectedIds(current.map(p => p.id))
        } catch (err) {
            console.error('Failed to load permissions', err)
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const currentIds = rolePermissions.map(p => p.id)
            const toAdd = selectedIds.filter(id => !currentIds.includes(id))
            const toRemove = currentIds.filter(id => !selectedIds.includes(id))

            const promises = []
            if (toAdd.length > 0) {
                promises.push(permissionApi.addRolePermissions({ roleId, permissionIds: toAdd }))
            }
            if (toRemove.length > 0) {
                promises.push(permissionApi.removeRolePermissions({ roleId, permissionIds: toRemove }))
            }

            if (promises.length > 0) {
                await Promise.all(promises)

                // Refresh local permissions if we are editing our own role
                const currentRoleId = localStorage.getItem('user_role_id')
                if (currentRoleId === roleId) {
                    console.log('[RolePermissionModal] Updating current user permissions...')
                    await refreshPermissions(roleId, roleLabel)
                }

                const ask = (window as any).Swal
                if (ask) {
                    ask.fire({ icon: 'success', title: 'Permissions mises à jour', timer: 1500, showConfirmButton: false })
                }
            }
            onClose()
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la mise à jour'
            const ask = (window as any).Swal
            if (ask) {
                ask.fire({ icon: 'error', title: 'Erreur', text: msg })
            } else {
                alert(msg)
            }
        } finally {
            setSaving(false)
        }
    }

    if (!show) return null

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">Permissions pour : {roleLabel}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2">Chargement des permissions...</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {allPermissions.map(p => {
                                    const isChecked = selectedIds.includes(p.id)
                                    return (
                                        <div key={p.id} className="col-md-6">
                                            <div
                                                className={`p-3 rounded-3 border transition-all cursor-pointer d-flex align-items-center justify-content-between ${isChecked ? 'bg-primary-light border-primary' : 'bg-light'}`}
                                                onClick={() => handleToggle(p.id)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className={`rounded-circle d-flex align-items-center justify-content-center ${isChecked ? 'bg-primary text-white' : 'bg-white border text-muted'}`} style={{ width: 24, height: 24 }}>
                                                        {isChecked && <i className="fa fa-check fs-xs"></i>}
                                                    </div>
                                                    <span className={`fs-sm fw-medium ${isChecked ? 'text-primary' : 'text-dark'}`}>{p.libelle}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-alt-secondary" onClick={onClose} disabled={saving}>Fermer</button>
                        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
        .bg-primary-light { background-color: rgba(13, 110, 253, 0.08); }
        .cursor-pointer { cursor: pointer; }
      `}</style>
        </div>
    )
}

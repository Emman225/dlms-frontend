import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import DataTable, { type Column } from '../components/common/DataTable'
import { permissionApi, type Permission } from '../api/permissionApi'
import { roleService } from '../services/roleService'
import { type Role } from '../api/roleApi'

export default function PermissionsList() {
    const [rows, setRows] = useState<Permission[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<string>('')
    const [rolePermissionIds, setRolePermissionIds] = useState<string[]>([])
    const [originalPermissionIds, setOriginalPermissionIds] = useState<string[]>([]) // Track original state
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Fetch all permissions and roles on mount
    useEffect(() => {
        // Parallelize loads
        (async () => {
            setLoading(true)
            try {
                const [permRes, rolesRes] = await Promise.all([
                    permissionApi.list(),
                    roleService.list()
                ])

                // Handle permissions
                if (permRes.isSuccess) {
                    setRows(permRes.data)
                }

                // Handle roles
                const rolesData = (rolesRes?.data as any) || []
                const rolesItems = Array.isArray(rolesData) ? rolesData : (rolesData?.data ?? [])
                setRoles(rolesItems)
            } catch (err) {
                console.error('Failed to initialize data', err)
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    // Fetch permissions for the selected role
    useEffect(() => {
        const fetchRolePerms = async () => {
            if (!selectedRoleId) {
                setRolePermissionIds([])
                setOriginalPermissionIds([])
                return
            }
            try {
                const res = await permissionApi.getByRoleId(selectedRoleId)
                if (res.isSuccess) {
                    const ids = res.data.map(p => p.id)
                    setRolePermissionIds(ids)
                    setOriginalPermissionIds(ids) // Keep a copy to calculate diff later
                }
            } catch (err) {
                console.error('Failed to fetch role permissions', err)
                setRolePermissionIds([])
                setOriginalPermissionIds([])
            }
        }
        fetchRolePerms()
    }, [selectedRoleId])

    const handleTogglePermission = (id: string) => {
        if (!selectedRoleId) return
        setRolePermissionIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSave = async () => {
        if (!selectedRoleId) return
        setSaving(true)
        try {
            const toAdd = rolePermissionIds.filter(id => !originalPermissionIds.includes(id))
            const toRemove = originalPermissionIds.filter(id => !rolePermissionIds.includes(id))

            const promises = []
            if (toAdd.length > 0) {
                promises.push(permissionApi.addRolePermissions({ roleId: selectedRoleId, permissionIds: toAdd }))
            }
            if (toRemove.length > 0) {
                promises.push(permissionApi.removeRolePermissions({ roleId: selectedRoleId, permissionIds: toRemove }))
            }

            if (promises.length > 0) {
                await Promise.all(promises)

                // OPTIMIZATION: Update original state instead of reloading page
                setOriginalPermissionIds([...rolePermissionIds])

                const ask = (window as any).Swal
                if (ask) {
                    await ask.fire({ icon: 'success', title: 'Permissions mises à jour', timer: 1500, showConfirmButton: false })
                }
            } else {
                const ask = (window as any).Swal
                if (ask) ask.fire({ icon: 'info', title: 'Aucun changement détecté' })
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la sauvegarde'
            const ask = (window as any).Swal
            if (ask) ask.fire({ icon: 'error', title: 'Erreur', text: msg })
            else alert(msg)
        } finally {
            setSaving(false)
        }
    }

    const columns = useMemo<Column<Permission>[]>(() => {
        const cols: Column<Permission>[] = [
            { key: 'libelle', title: 'Libellé', render: (p) => <span className="fw-semibold fs-sm">{p.libelle ?? '—'}</span> },
            { key: 'id', title: 'ID unique' },
        ]

        // Add checkbox column if a role is selected
        if (selectedRoleId) {
            cols.unshift({
                key: 'selection',
                title: 'Accès',
                width: 80,
                align: 'center',
                render: (p) => (
                    <div className="form-check d-flex justify-content-center">
                        <input
                            className="form-check-input cursor-pointer"
                            type="checkbox"
                            checked={rolePermissionIds.includes(p.id)}
                            onChange={() => handleTogglePermission(p.id)}
                            style={{ width: '20px', height: '20px' }}
                        />
                    </div>
                )
            })
        }

        return cols
    }, [selectedRoleId, rolePermissionIds])

    return (
        <MainLayout>
            <div className="content content-full">
                <div className="block block-rounded shadow-sm">
                    <div className="block-header block-header-default d-flex justify-content-between align-items-center py-3">
                        <h3 className="block-title fs-4 fw-bold mb-0">
                            <i className="fa fa-shield-halved text-primary me-2"></i>
                            Gestion des Permissions par Rôle
                        </h3>
                        {selectedRoleId && (
                            <button
                                className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                ) : (
                                    <i className="fa fa-save"></i>
                                )}
                                <span>Enregistrer</span>
                            </button>
                        )}
                    </div>

                    <div className="block-content bg-body-light border-bottom p-4">
                        <div className="row align-items-center">
                            <div className="col-md-4">
                                <label className="form-label fw-bold text-muted mb-2">1. Sélectionner un rôle :</label>
                                <select
                                    className="form-select border-0 shadow-sm py-2"
                                    value={selectedRoleId}
                                    onChange={(e) => setSelectedRoleId(e.target.value)}
                                    style={{ borderRadius: '10px' }}
                                >
                                    <option value="">-- Choisir un rôle --</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.libelle}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-8 text-md-end mt-3 mt-md-0">
                                {selectedRoleId ? (
                                    <div className="alert alert-info d-inline-block mb-0 py-2 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                                        <i className="fa fa-info-circle me-2"></i>
                                        Cochez les permissions à accorder au rôle <strong>{roles.find(r => r.id === selectedRoleId)?.libelle}</strong>
                                    </div>
                                ) : (
                                    <span className="text-muted italic"><i className="fa fa-arrow-left me-2"></i>Veuillez choisir un rôle pour commencer l'attribution</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="block-content block-content-full p-0">
                        <DataTable
                            title="Référentiel des Permissions"
                            columns={columns}
                            rows={rows}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
            <style>{`
        .cursor-pointer { cursor: pointer; }
        .form-check-input:checked { background-color: #0d6efd; border-color: #0d6efd; }
      `}</style>
        </MainLayout>
    )
}

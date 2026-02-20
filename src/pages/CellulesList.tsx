import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { celluleService } from '../services/celluleService'
import CelluleModal, { type CelluleFormValues } from '../components/cellules/CelluleModal'
import { celluleApi, type Cellule } from '../api/celluleApi'
import { authService } from '../services/authService'
import DataTable, { type Column } from '../components/common/DataTable'
import { usePermissions } from '../context/PermissionContext'

export default function CellulesList() {
    const { hasPermission } = usePermissions()
    const [rows, setRows] = useState<Array<any>>([])
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<number | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<Cellule | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const loadList = async () => {
        setLoading(true)
        try {
            const res = await celluleService.list()
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

    const onNew = () => {
        setEditing(null)
        setShowModal(true)
    }

    const onEdit = (c: Cellule) => {
        setEditing(c)
        setShowModal(true)
    }

    const onDelete = async (c: Cellule) => {
        const ask = (window as any).Swal
        const confirm = ask
            ? await ask.fire({ icon: 'warning', title: 'Supprimer cette cellule ?', text: c.libelle, showCancelButton: true, confirmButtonText: 'Oui, supprimer' })
            : { isConfirmed: window.confirm(`Supprimer la cellule « ${c.libelle} » ?`) }
        if (!confirm.isConfirmed) return
        try {
            setSubmitting(true)
            await celluleApi.remove({ id: c.id, deletedBy: String(userId ?? '') })

            // OPTIMIZATION: Update local state
            setRows(prev => prev.filter(row => row.id !== c.id))

            ask && ask.fire({ icon: 'success', title: 'Supprimé', timer: 1200, showConfirmButton: false })
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Erreur lors de la suppression'
            ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
        } finally {
            setSubmitting(false)
        }
    }

    const handleSubmit = async (values: CelluleFormValues) => {
        try {
            setSubmitting(true)
            if (editing?.id) {
                const payload = {
                    id: editing.id,
                    libelle: values.libelle,
                    adresse: values.adresse,
                    posteId: values.posteId,
                    type: values.type,
                    valeurTension: Number(values.valeurTension),
                    updatedBy: String(userId ?? '')
                };
                await celluleApi.edit(payload)
            } else {
                await celluleApi.add({
                    libelle: values.libelle,
                    adresse: values.adresse,
                    posteId: values.posteId,
                    type: values.type,
                    valeurTension: Number(values.valeurTension),
                    createdBy: String(userId ?? '')
                })
            }
            await loadList()
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
        { key: 'adresse', title: 'Adresse' },
        { key: 'type', title: 'Type' },
        { key: 'valeurTension', title: 'Tension' },
        { key: 'poste', title: 'Poste', render: (r) => r.poste?.libelle ?? r.poste?.numero ?? '—' },
    ], [])

    return (
        <MainLayout>
            <div className="content content-full">
                <div className="block block-rounded">
                    <div className="block-header block-header-default">
                        <h3 className="block-title">Liste cellules</h3>
                        <div className="block-options">
                            {hasPermission('Créer une cellule') && (
                                <button className="btn btn-sm btn-success" onClick={onNew}>
                                    <i className="fa-solid fa-plus me-1"></i> Nouveau
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="block-content block-content-full">
                        <DataTable
                            title="Cellules"
                            columns={columns}
                            rows={rows}
                            loading={loading}
                            actions={(c: any) => (
                                <>
                                    {hasPermission('Modifier une cellule') && (
                                        <button className="btn btn-sm btn-alt-secondary" onClick={() => onEdit(c)} title="Editer">
                                            <i className="fa-solid fa-pen"></i>
                                        </button>
                                    )}
                                    {hasPermission('Supprimer une cellule') && (
                                        <button className="btn btn-sm btn-alt-danger" onClick={() => onDelete(c)} disabled={submitting} title="Supprimer">
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    )}
                                </>
                            )}
                        />
                    </div>
                </div>
            </div>
            <CelluleModal
                show={showModal}
                onClose={() => { if (!submitting) { setShowModal(false); setEditing(null) } }}
                onSubmit={handleSubmit}
                initial={editing ?? undefined}
                submitting={submitting}
            />
        </MainLayout>
    )
}

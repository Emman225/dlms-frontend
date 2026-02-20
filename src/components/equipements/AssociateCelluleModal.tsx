import { useEffect, useState } from 'react'
import type { Equipement } from '../../api/equipementApi'

export default function AssociateCelluleModal({
    show,
    onClose,
    onSave,
    equipement,
    cellules,
    submitting,
    initialSelectedIds,
}: {
    show: boolean
    onClose: () => void
    onSave: (celluleIds: number[]) => Promise<void> | void
    equipement: Equipement | null
    cellules: any[]
    submitting: boolean
    initialSelectedIds?: number[]
}) {
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (show) {
            setSelectedIds(initialSelectedIds || [])
            setSearchTerm('')
        }
    }, [show, initialSelectedIds])

    if (!show || !equipement) return null

    const filteredCellules = cellules.filter(c =>
        (c.libelle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.poste?.libelle || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSave = () => {
        onSave(selectedIds)
    }

    return (
        <div
            className="modal fade show"
            style={{ display: 'block', position: 'fixed', inset: 0, zIndex: 2050, overflowY: 'auto', pointerEvents: 'auto', backgroundColor: 'rgba(0,0,0,0.5)' }}
            aria-modal="true"
            role="dialog"
        >
            <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()} style={{ marginTop: '6vh' }}>
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            <i className="fa-solid fa-link me-2"></i>
                            Gérer les cellules de : {equipement.libelle}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <div className="modal-body p-4">
                        <div className="mb-3">
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="fa fa-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 bg-light"
                                    placeholder="Rechercher une cellule ou un poste..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="table-responsive" style={{ maxHeight: '400px' }}>
                            <table className="table table-hover table-vcenter">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={filteredCellules.length > 0 && filteredCellules.every(c => selectedIds.includes(c.id))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        const newIds = [...new Set([...selectedIds, ...filteredCellules.map(c => c.id)])]
                                                        setSelectedIds(newIds)
                                                    } else {
                                                        const filteredIds = filteredCellules.map(c => c.id)
                                                        setSelectedIds(selectedIds.filter(id => !filteredIds.includes(id)))
                                                    }
                                                }}
                                            />
                                        </th>
                                        <th>Libellé Cellule</th>
                                        <th>Poste</th>
                                        <th>Type</th>
                                        <th>Tension</th>
                                    </tr>
                                </thead>
                                <tbody style={{ scrollbarGutter: 'stable' }}>
                                    {filteredCellules.length > 0 ? (
                                        filteredCellules.map((c) => (
                                            <tr key={c.id} onClick={() => toggleSelect(c.id)} style={{ cursor: 'pointer' }}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedIds.includes(c.id)}
                                                        readOnly
                                                    />
                                                </td>
                                                <td className="fw-semibold">{c.libelle}</td>
                                                <td>{c.poste?.libelle || c.posteLibelle || '—'}</td>
                                                <td>{c.type || '—'}</td>
                                                <td>{c.valeurTension || '—'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-muted">
                                                Aucune cellule trouvée
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                            <span className="text-muted small">
                                <strong>{selectedIds.length}</strong> cellule(s) sélectionnée(s)
                            </span>
                            {selectedIds.length > 0 && (
                                <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => setSelectedIds([])}>
                                    Tout désélectionner
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer bg-light border-0">
                        <button type="button" className="btn btn-alt-secondary px-4" onClick={onClose} disabled={submitting}>
                            Fermer
                        </button>
                        <button type="button" className="btn btn-primary px-4" onClick={handleSave} disabled={submitting}>
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <i className="fa fa-save me-2"></i>
                                    Enregistrer les modifications
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

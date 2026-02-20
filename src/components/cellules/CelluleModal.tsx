import { useEffect, useState } from 'react'
import type { Cellule } from '../../api/celluleApi'
import { posteService } from '../../services/posteService'
import { type Poste } from '../../api/posteApi'

export type CelluleFormValues = {
    libelle: string
    adresse: string
    posteId: number
    type: string
    valeurTension: number | ''
}

export default function CelluleModal({
    show,
    onClose,
    onSubmit,
    initial,
    submitting,
}: {
    show: boolean
    onClose: () => void
    onSubmit: (values: CelluleFormValues) => Promise<void> | void
    initial?: Partial<Cellule>
    submitting?: boolean
}) {
    const [values, setValues] = useState<CelluleFormValues>({ libelle: '', adresse: '', posteId: 0, type: '', valeurTension: '' })
    const [postes, setPostes] = useState<Poste[]>([])
    const [loadingPostes, setLoadingPostes] = useState(false)

    useEffect(() => {
        setValues({
            libelle: initial?.libelle ?? '',
            adresse: initial?.adresse ?? '',
            posteId: initial?.posteId ?? 0,
            type: initial?.type ?? '',
            valeurTension: initial?.valeurTension ?? '',
        })
    }, [initial, show])

    useEffect(() => {
        if (show) {
            document.body.classList.add('modal-open')
            loadPostes()
        }
        return () => {
            document.body.classList.remove('modal-open')
        }
    }, [show])

    const loadPostes = async () => {
        try {
            setLoadingPostes(true)
            const res = await posteService.list()
            const data = (res?.data as any) || []
            const items = Array.isArray(data) ? data : (data?.data ?? [])
            setPostes(items)
        } catch (e) {
            console.error('Failed to load postes', e)
        } finally {
            setLoadingPostes(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setValues((v) => ({ ...v, [name]: name === 'posteId' || name === 'valeurTension' ? Number(value) : value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(values)
    }

    if (!show) return null

    return (
        <div
            className="modal fade show"
            style={{ display: 'block', position: 'fixed', inset: 0, zIndex: 2050, overflowY: 'auto', pointerEvents: 'auto', backgroundColor: 'transparent' }}
            aria-modal="true"
            aria-hidden="false"
            role="dialog"
            tabIndex={-1}
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        >
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ marginTop: '10vh', position: 'relative', zIndex: 2051 }}>
                <div className="modal-content" style={{ backgroundColor: '#ffffff', position: 'relative', zIndex: 2052 }}>
                    <div className="modal-header">
                        <h5 className="modal-title">{initial?.id ? 'Modifier une cellule' : 'Nouvelle cellule'}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">

                            <div className="mb-3">
                                <label className="form-label">Libellé</label>
                                <input className="form-control" name="libelle" value={values.libelle} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Adresse</label>
                                <input className="form-control" name="adresse" value={values.adresse} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Type</label>
                                <select className="form-select" name="type" value={values.type} onChange={handleChange} required>
                                    <option value="" disabled>-- Sélectionner --</option>
                                    <option value="Arrivée">Arrivée</option>
                                    <option value="Départ">Départ</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Tension (KV)</label>
                                <select
                                    className="form-select"
                                    name="valeurTension"
                                    value={values.valeurTension}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>-- Sélectionner --</option>
                                    <option value={0.4}>0.4</option>
                                    <option value={8.66}>8.66</option>
                                    <option value={15}>15</option>
                                    <option value={30}>30</option>
                                    <option value={33}>33</option>
                                    <option value={63}>63</option>
                                    <option value={150}>150</option>
                                    <option value={225}>225</option>
                                    <option value={400}>400</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Poste</label>
                                <select className="form-select" name="posteId" value={values.posteId} onChange={handleChange} required>
                                    <option value={0} disabled>Sélectionner un poste</option>
                                    {postes.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.libelle} ({p.numero})
                                        </option>
                                    ))}
                                </select>
                                {loadingPostes && <div className="form-text">Chargement des postes...</div>}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-alt-secondary" onClick={onClose} disabled={!!submitting}>Annuler</button>
                            <button type="submit" className="btn btn-premium-green" disabled={!!submitting}>
                                <i className="fa fa-save me-1"></i> {submitting ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="modal-backdrop fade show" style={{ position: 'fixed', inset: 0, zIndex: 1040, pointerEvents: 'none' as any, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
        </div>
    )
}

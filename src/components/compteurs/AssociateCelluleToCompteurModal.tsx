import { useState, useEffect } from 'react'

type Props = {
  show: boolean
  onClose: () => void
  onSave: (celluleId: number) => void
  compteur: any | null
  cellules: Array<any>
  submitting: boolean
}

export default function AssociateCelluleToCompteurModal({ show, onClose, onSave, compteur, cellules, submitting }: Props) {
  const [selectedCelluleId, setSelectedCelluleId] = useState<number>(0)

  useEffect(() => {
    if (show) setSelectedCelluleId(0)
  }, [show])

  if (!show) return null

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title text-white">Associer à une cellule</h5>
            <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => !submitting && onClose()}></button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <p className="mb-2">Associer le compteur : <strong>{compteur?.numeroCompteur}</strong></p>
              <label className="form-label" htmlFor="cellule-select">Sélectionner une cellule</label>
              <select
                id="cellule-select"
                className="form-select"
                value={selectedCelluleId}
                onChange={(e) => setSelectedCelluleId(Number(e.target.value))}
                disabled={submitting}
              >
                <option value={0}>Choisir une cellule...</option>
                {cellules.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}{c.type ? ` (${c.type})` : ''}{c.poste?.libelle ? ` — ${c.poste.libelle}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-alt-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSave(selectedCelluleId)}
              disabled={submitting || !selectedCelluleId}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Validation...
                </>
              ) : (
                'Valider'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

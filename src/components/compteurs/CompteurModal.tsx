import { useEffect, useState } from 'react'
import type { Compteur } from '../../api/compteurApi'

export type CompteurFormValues = {
  idCompteur: string
  numeroCompteur: string
  marqueCompteur: string
  datePremierePose: string
  datePoseActuelle: string
  typecompteur: string
  fabriquantId: number
  etatcontacteur: string
}

export default function CompteurModal({
  show,
  onClose,
  onSubmit,
  initial,
  submitting,
  fabricants,
}: {
  show: boolean
  onClose: () => void
  onSubmit: (values: CompteurFormValues) => Promise<void> | void
  initial?: Partial<Compteur>
  submitting?: boolean
  fabricants: Array<{ id: number; libelle: string }>
}) {
  const [values, setValues] = useState<CompteurFormValues>({
    idCompteur: '',
    numeroCompteur: '',
    marqueCompteur: '',
    datePremierePose: '',
    datePoseActuelle: '',
    typecompteur: '',
    fabriquantId: 0,
    etatcontacteur: 'on',
  })

  useEffect(() => {
    const numero = initial?.numeroCompteur ?? ''
    setValues({
      idCompteur: initial?.idCompteur || (numero ? `APAESX30${numero}` : ''),
      numeroCompteur: numero,
      marqueCompteur: initial?.marqueCompteur ?? '',
      datePremierePose: initial?.datePremierePose ? String(initial.datePremierePose).substring(0, 10) : '',
      datePoseActuelle: initial?.datePoseActuelle ? String(initial.datePoseActuelle).substring(0, 10) : '',
      typecompteur: initial?.typecompteur ?? '',
      fabriquantId: typeof initial?.fabriquantId === 'number' ? initial.fabriquantId : 0,
      etatcontacteur: initial?.etatcontacteur ?? 'on',
    })
  }, [initial, show])

  useEffect(() => {
    if (show) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [show])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setValues((v) => {
      const updated = { ...v, [name]: name === 'fabriquantId' ? Number(value) : value }
      // Auto-generate idCompteur if numeroCompteur changes
      if (name === 'numeroCompteur') {
        updated.idCompteur = value.trim() ? `APAESX30${value.trim()}` : ''
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...values,
      datePremierePose: values.datePremierePose ? new Date(values.datePremierePose).toISOString() : '',
      datePoseActuelle: values.datePoseActuelle ? new Date(values.datePoseActuelle).toISOString() : '',
    })
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
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ marginTop: '6vh', position: 'relative', zIndex: 2051 }}>
        <div className="modal-content" style={{ backgroundColor: '#ffffff', position: 'relative', zIndex: 2052 }}>
          <div className="modal-header">
            <h5 className="modal-title">{initial?.id ? 'Modifier un compteur' : 'Nouveau compteur'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">ID Compteur</label>
                  <input
                    className="form-control"
                    name="idCompteur"
                    value={values.idCompteur}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                    placeholder="Auto-généré"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Numéro Compteur</label>
                  <input className="form-control" name="numeroCompteur" value={values.numeroCompteur} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Marque Compteur</label>
                  <input className="form-control" name="marqueCompteur" value={values.marqueCompteur} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Type Compteur</label>
                  <input className="form-control" name="typecompteur" value={values.typecompteur} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date première pose</label>
                  <input type="date" className="form-control" name="datePremierePose" value={values.datePremierePose} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date pose actuelle</label>
                  <input type="date" className="form-control" name="datePoseActuelle" value={values.datePoseActuelle} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fabricant</label>
                  <select className="form-select" name="fabriquantId" value={values.fabriquantId} onChange={handleChange} required>
                    <option value={0} disabled>-- Sélectionner --</option>
                    {fabricants.map((f) => (
                      <option key={f.id} value={f.id}>{f.libelle ?? f.id}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Etat contacteur</label>
                  <select className="form-select" name="etatcontacteur" value={values.etatcontacteur} onChange={handleChange}>
                    <option value="on">on</option>
                    <option value="off">off</option>
                  </select>
                </div>
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
      {/* Backdrop */}
      <div className="modal-backdrop fade show" style={{ position: 'fixed', inset: 0, zIndex: 1040, pointerEvents: 'none' as any, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
    </div>
  )
}

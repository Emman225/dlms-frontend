import { useEffect, useState } from 'react'
import type { Equipement } from '../../api/equipementApi'

export type EquipementFormValues = {
  numeroSerie: string
  libelle: string
  adresseIp: string
  type: string
  marque: string
  port: string
  serialPort: string
  datePremierePose: string
  datePoseActuelle: string
}

export default function EquipementModal({
  show,
  onClose,
  onSubmit,
  initial,
  submitting,
}: {
  show: boolean
  onClose: () => void
  onSubmit: (values: EquipementFormValues) => Promise<void> | void
  initial?: Partial<Equipement>
  submitting?: boolean
}) {
  const [values, setValues] = useState<EquipementFormValues>({
    numeroSerie: '',
    libelle: '',
    adresseIp: '',
    type: '',
    marque: '',
    port: '',
    serialPort: '',
    datePremierePose: '',
    datePoseActuelle: '',
  })

  useEffect(() => {
    setValues({
      numeroSerie: initial?.numeroSerie ?? '',
      libelle: initial?.libelle ?? '',
      adresseIp: initial?.adresseIp ?? '',
      type: initial?.type ?? '',
      marque: initial?.marque ?? '',
      port: initial?.port ?? '',
      serialPort: initial?.serialPort ?? '',
      datePremierePose: initial?.datePremierePose ? initial.datePremierePose.substring(0, 10) : '',
      datePoseActuelle: initial?.datePoseActuelle ? initial.datePoseActuelle.substring(0, 10) : '',
    })
    console.log('EquipementModal: Initialized with', initial)
  }, [initial, show])

  useEffect(() => {
    if (show) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [show])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...values,
      // Normalize dates to ISO if provided
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
            <h5 className="modal-title">{initial?.id ? 'Modifier un équipement' : 'Nouvel équipement'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Numéro de série</label>
                  <input className="form-control" name="numeroSerie" value={values.numeroSerie} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Libellé</label>
                  <input className="form-control" name="libelle" value={values.libelle} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Adresse IP</label>
                  <input className="form-control" name="adresseIp" value={values.adresseIp} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Type</label>
                  <input className="form-control" name="type" value={values.type} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Marque</label>
                  <input className="form-control" name="marque" value={values.marque} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Port</label>
                  <input className="form-control" name="port" value={values.port} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Serial Port</label>
                  <input className="form-control" name="serialPort" value={values.serialPort} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date première pose</label>
                  <input type="date" className="form-control" name="datePremierePose" value={values.datePremierePose} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date pose actuelle</label>
                  <input type="date" className="form-control" name="datePoseActuelle" value={values.datePoseActuelle} onChange={handleChange} />
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

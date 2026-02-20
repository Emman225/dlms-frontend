import { useEffect, useState } from 'react'
import type { Poste } from '../../api/posteApi'

export type PosteFormValues = {
  numero: string
  libelle: string
  adresse: string
}

export default function PosteModal({
  show,
  onClose,
  onSubmit,
  initial,
  submitting,
}: {
  show: boolean
  onClose: () => void
  onSubmit: (values: PosteFormValues) => Promise<void> | void
  initial?: Partial<Poste>
  submitting?: boolean
}) {
  const [values, setValues] = useState<PosteFormValues>({ numero: '', libelle: '', adresse: '' })

  useEffect(() => {
    setValues({
      numero: initial?.numero ?? '',
      libelle: initial?.libelle ?? '',
      adresse: initial?.adresse ?? '',
    })
  }, [initial, show])

  useEffect(() => {
    if (show) {
      document.body.classList.add('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [show])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
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
            <h5 className="modal-title">{initial?.id ? 'Modifier un poste' : 'Nouveau poste'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Numéro</label>
                <input className="form-control" name="numero" value={values.numero} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Libellé</label>
                <input className="form-control" name="libelle" value={values.libelle} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Adresse</label>
                <input className="form-control" name="adresse" value={values.adresse} onChange={handleChange} required />
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
      {/* Backdrop (no click-to-close to avoid accidental closes) */}
      <div className="modal-backdrop fade show" style={{ position: 'fixed', inset: 0, zIndex: 1040, pointerEvents: 'none' as any, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
    </div>
  )
}

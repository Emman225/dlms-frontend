import { useEffect, useState } from 'react'
import type { Role } from '../../api/roleApi'

export type RoleFormValues = {
  libelle: string
  code: string
  description: string
}

export default function RoleModal({
  show,
  onClose,
  onSubmit,
  initial,
  submitting,
}: {
  show: boolean
  onClose: () => void
  onSubmit: (values: RoleFormValues) => Promise<void> | void
  initial?: Partial<Role>
  submitting?: boolean
}) {
  const [values, setValues] = useState<RoleFormValues>({
    libelle: '',
    code: '',
    description: '',
  })

  useEffect(() => {
    setValues({
      libelle: initial?.libelle ?? '',
      code: initial?.code ?? '',
      description: initial?.description ?? '',
    })
  }, [initial, show])

  useEffect(() => {
    if (show) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [show])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ marginTop: '6vh', position: 'relative', zIndex: 2051 }}>
        <div className="modal-content" style={{ backgroundColor: '#ffffff', position: 'relative', zIndex: 2052 }}>
          <div className="modal-header">
            <h5 className="modal-title">{initial?.id ? 'Modifier un rôle' : 'Nouveau rôle'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Libellé</label>
                  <input className="form-control" name="libelle" value={values.libelle} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Code</label>
                  <input className="form-control" name="code" value={values.code} onChange={handleChange} required />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" name="description" rows={3} value={values.description} onChange={handleChange} />
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
      <div className="modal-backdrop fade show" style={{ position: 'fixed', inset: 0, zIndex: 1040, pointerEvents: 'none' as any, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
    </div>
  )
}

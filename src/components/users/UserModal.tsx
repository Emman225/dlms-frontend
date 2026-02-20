import { useEffect, useState } from 'react'
import type { User } from '../../api/userApi'

export type UserFormValues = {
  nom: string
  prenoms: string
  dateNaissance: string
  email: string
  mobile: string
  roleId: string
  posteId: number | ''
}

export default function UserModal({
  show,
  onClose,
  onSubmit,
  initial,
  submitting,
  roles,
  postes,
}: {
  show: boolean
  onClose: () => void
  onSubmit: (values: UserFormValues) => Promise<void> | void
  initial?: Partial<User>
  submitting?: boolean
  roles: Array<{ id: string; libelle: string }>
  postes: Array<{ id: number; libelle: string }>
}) {
  const [values, setValues] = useState<UserFormValues>({
    nom: '',
    prenoms: '',
    dateNaissance: '',
    email: '',
    mobile: '',
    roleId: '',
    posteId: '',
  })

  const toLocalDate = (iso?: string | null) => {
    if (!iso) return ''
    try {
      return String(iso).slice(0, 10)
    } catch { return '' }
  }

  useEffect(() => {
    setValues({
      nom: initial?.nom ?? '',
      prenoms: initial?.prenoms ?? '',
      dateNaissance: toLocalDate(initial?.dateNaissance),
      email: initial?.email ?? '',
      mobile: initial?.mobile ?? '',
      roleId: initial?.roleId ?? initial?.role?.id ?? '',
      posteId: initial?.posteId ?? initial?.poste?.id ?? '',
    })
  }, [initial, show])
  // ... (rest of useEffect and hooks remains the same until return)
  // I will split this into two replacements because the file structure allows it, but replace_file_content works on contiguous blocks.
  // Wait, I can do it in one block if I'm careful or just target the type definition and props first, then the JSX later? 
  // The prompt rules say "single contiguous block". 
  // I will use multi_replace.


  useEffect(() => {
    if (show) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [show])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'posteId') {
      setValues((v) => ({ ...v, [name]: value === '' ? '' : Number(value) }))
    } else {
      setValues((v) => ({ ...v, [name]: value }))
    }
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
            <h5 className="modal-title">{initial?.id ? 'Modifier un utilisateur' : 'Nouvel utilisateur'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nom</label>
                  <input className="form-control" name="nom" value={values.nom} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Prénoms</label>
                  <input className="form-control" name="prenoms" value={values.prenoms} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date de naissance</label>
                  <input type="date" className="form-control" name="dateNaissance" value={values.dateNaissance} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" value={values.email} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Téléphone</label>
                  <input className="form-control" name="mobile" value={values.mobile} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Rôle</label>
                  <select className="form-select" name="roleId" value={values.roleId} onChange={handleChange} required>
                    <option value="" disabled>-- Sélectionner --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.libelle ?? r.id}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Poste (Optionnel)</label>
                  <select className="form-select" name="posteId" value={values.posteId} onChange={handleChange}>
                    <option value="">-- Pas de poste --</option>
                    {postes.map(p => (
                      <option key={p.id} value={p.id}>{p.libelle ?? p.id}</option>
                    ))}
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
      <div className="modal-backdrop fade show" style={{ position: 'fixed', inset: 0, zIndex: 1040, pointerEvents: 'none' as any, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { Commande } from '../../api/commandeApi'

export type CommandeFormValues = {
  libellecommande: string
  dateexec: string | null
  datefin: string | null
  numeroprofile: number
  nombreentree: number
  datedebut: string | null
  dateexp: string | null
  decalage: number
  typecommandeId: number
  compteurId: number[]
}

export default function CommandeModal({
  show,
  onClose,
  onSubmit,
  initial,
  submitting,
  types,
  compteurs,
}: {
  show: boolean
  onClose: () => void
  onSubmit: (values: CommandeFormValues) => Promise<void> | void
  initial?: Partial<Commande>
  submitting?: boolean
  types: Array<{ id: number; libelletype: string }>
  compteurs: Array<{ id: number; numeroCompteur?: string; idCompteur?: string }>
}) {
  const [values, setValues] = useState<CommandeFormValues>({
    libellecommande: '',
    dateexec: '',
    datefin: '',
    numeroprofile: 0,
    nombreentree: 0,
    datedebut: '',
    dateexp: '',
    decalage: 0,
    typecommandeId: 0,
    compteurId: [],
  })

  const [pickerOpen, setPickerOpen] = useState(false)
  const [filterText, setFilterText] = useState('')

  const toLocalDT = (iso?: string | null) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      const tz = d.getTimezoneOffset() * 60000
      return new Date(d.getTime() - tz).toISOString().slice(0, 16)
    } catch { return '' }
  }

  useEffect(() => {
    setValues({
      libellecommande: initial?.libellecommande ?? '',
      dateexec: toLocalDT(initial?.dateexec ?? undefined),
      datefin: toLocalDT(initial?.datefin ?? undefined),
      numeroprofile: initial?.numeroprofile ?? 0,
      nombreentree: initial?.nombreentree ?? 0,
      datedebut: toLocalDT(initial?.datedebut ?? undefined),
      dateexp: toLocalDT(initial?.dateexp ?? undefined),
      decalage: (initial as any)?.decalage ?? 0,
      typecommandeId: (initial?.typecommandeId ?? initial?.typecommande?.id) ?? 0,
      compteurId: Array.isArray(initial?.compteurId) ? (initial?.compteurId as number[]) : [],
    })
  }, [initial, show])

  useEffect(() => {
    if (show) document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [show])

  const nowLocalDT = () => {
    const d = new Date()
    const tz = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tz).toISOString().slice(0, 16)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'typecommandeId') {
      const numVal = Number(value)
      const typeName = types.find(t => t.id === numVal)?.libelletype?.toLowerCase() || ''
      if (typeName.includes('heure actuelle')) {
        const now = nowLocalDT()
        setValues((v) => ({ ...v, typecommandeId: numVal, dateexec: now, dateexp: now }))
      } else {
        setValues((v) => ({ ...v, typecommandeId: numVal }))
      }
    } else if (name === 'numeroprofile' || name === 'nombreentree' || name === 'decalage') {
      setValues((v) => ({ ...v, [name]: Number(value) }))
    } else {
      setValues((v) => ({ ...v, [name]: value }))
    }
  }

  const toISO = (v: string | null) => (v ? new Date(v).toISOString() : null)

  // Validation en temps réel
  const execAfterExp = !!(values.dateexec && values.dateexp && new Date(values.dateexec) > new Date(values.dateexp))
  const debutAfterFin = !!(values.datedebut && values.datefin && new Date(values.datedebut) > new Date(values.datefin))
  const hasValidationError = execAfterExp || debutAfterFin

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ask = (window as any).Swal

    if (execAfterExp) {
      const msg = "L'heure d'exécution doit être inférieure ou égale à l'heure d'expiration."
      ask ? ask.fire({ icon: 'warning', title: 'Validation', text: msg }) : alert(msg)
      return
    }

    if (debutAfterFin) {
      const msg = "La date de début doit être inférieure ou égale à la date de fin."
      ask ? ask.fire({ icon: 'warning', title: 'Validation', text: msg }) : alert(msg)
      return
    }

    await onSubmit({
      ...values,
      dateexec: toISO(values.dateexec),
      datefin: toISO(values.datefin),
      datedebut: toISO(values.datedebut),
      dateexp: toISO(values.dateexp),
    })
  }

  // Déterminer le mode d'affichage en fonction du type sélectionné
  const selectedType = types.find(t => t.id === values.typecommandeId)?.libelletype?.toLowerCase() || ''

  // Logique basée sur les captures d'écran
  const isProfileEntries = selectedType.includes('dernières entrées') // "Obtenir les dernières entrées de profil"
  const isProfileData = selectedType.includes('données du profil') // "Obtenir les données du profil"
  // const isGeneric = !isProfileEntries && !isProfileData

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
      <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()} style={{ height: '90vh', marginTop: '5vh', position: 'relative', zIndex: 2051 }}>
        <div className="modal-content" style={{ backgroundColor: '#ffffff', position: 'relative', zIndex: 2052, height: '100%' }}>
          <div className="modal-header">
            <h5 className="modal-title">{initial?.id ? 'Modifier une commande' : 'Nouvelle commande'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="modal-body" style={{ flex: '1 1 auto', overflowY: 'auto' }}>
              <div className="row g-3">
                {/* Colonne Gauche : Infos générales */}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Description de la commande <i className="fa fa-info-circle text-info ms-1" title="Libellé"></i></label>
                    <input className="form-control" name="libellecommande" placeholder="Description..." value={values.libellecommande} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Heure d'exécution <i className="fa fa-info-circle text-info ms-1" title="Date d'exécution planifiée"></i></label>
                    <input type="datetime-local" className={`form-control ${execAfterExp ? 'is-invalid' : ''}`} name="dateexec" value={values.dateexec ?? ''} onChange={handleChange} />
                    {execAfterExp && <div className="invalid-feedback">L'heure d'exécution doit être inférieure ou égale à l'heure d'expiration.</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Heure d'expiration <i className="fa fa-info-circle text-info ms-1" title="Date d'expiration"></i></label>
                    <input type="datetime-local" className={`form-control ${execAfterExp ? 'is-invalid' : ''}`} name="dateexp" value={values.dateexp ?? ''} onChange={handleChange} />
                  </div>
                </div>

                {/* Colonne Droite : Paramètres spécifiques au type */}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Type <i className="fa fa-info-circle text-info ms-1"></i></label>
                    <select className="form-select" name="typecommandeId" value={values.typecommandeId} onChange={handleChange} required>
                      <option value={0} disabled>-- Sélectionner --</option>
                      {types
                        .filter((t) => !(t.libelletype || '').toLowerCase().includes('dernières entrées'))
                        .map((t) => (
                          <option key={t.id} value={t.id}>{t.libelletype ?? t.id}</option>
                        ))}
                    </select>
                    {values.typecommandeId !== 0 && (
                      <div className="form-text text-muted fst-italic mt-1">
                        {isProfileEntries && "Renvoie les données les plus récentes du registre d'événements sélectionné."}
                        {isProfileData && "Retourne toutes les données dans une période donnée pour un profil donné."}
                      </div>
                    )}
                  </div>

                  {/* Champs dynamiques */}
                  {(isProfileEntries || isProfileData) && (
                    <div className="mb-3">
                      <label className="form-label">Numéro de profil <i className="fa fa-info-circle text-info ms-1"></i></label>
                      <input type="number" className="form-control" name="numeroprofile" value={values.numeroprofile} onChange={handleChange} />
                    </div>
                  )}

                  {isProfileData && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Date de début <i className="fa fa-info-circle text-info ms-1"></i></label>
                        <input type="datetime-local" className={`form-control ${debutAfterFin ? 'is-invalid' : ''}`} name="datedebut" value={values.datedebut ?? ''} onChange={handleChange} />
                        {debutAfterFin && <div className="invalid-feedback">La date de début doit être inférieure ou égale à la date de fin.</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Date de fin <i className="fa fa-info-circle text-info ms-1"></i></label>
                        <input type="datetime-local" className={`form-control ${debutAfterFin ? 'is-invalid' : ''}`} name="datefin" value={values.datefin ?? ''} onChange={handleChange} />
                      </div>
                    </>
                  )}

                  {isProfileEntries && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Nombre d'entrées à obtenir <i className="fa fa-info-circle text-info ms-1"></i></label>
                        <input type="number" className="form-control" name="nombreentree" value={values.nombreentree} onChange={handleChange} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Décalage <i className="fa fa-info-circle text-info ms-1"></i></label>
                        <input type="number" className="form-control" name="decalage" value={values.decalage} onChange={handleChange} />
                      </div>
                    </>
                  )}
                </div>

                {/* Sélection Compteurs (Full width) */}
                <div className="col-12 mt-4">
                  <label className="form-label">Groupe de compteurs / Sélection <i className="fa fa-info-circle text-info ms-1"></i></label>
                  <div className="position-relative">
                    <div className="form-control d-flex align-items-center justify-content-between" onClick={() => setPickerOpen((v) => !v)} style={{ cursor: 'pointer' }}>
                      <div>
                        {values.compteurId.length === 0 ? (
                          <span className="text-muted">Sélectionner des compteurs...</span>
                        ) : (
                          <span className="fw-semibold text-primary">{values.compteurId.length} compteur(s) sélectionné(s)</span>
                        )}
                      </div>
                      <i className={`fa fa-chevron-${pickerOpen ? 'up' : 'down'}`}></i>
                    </div>
                    {pickerOpen && (
                      <div className="border rounded mt-1 shadow-lg animate__animated animate__fadeIn" style={{ position: 'absolute', zIndex: 2053, background: '#fff', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)' }}>
                        <div className="p-2 bg-light border-bottom">
                          <input
                            className="form-control form-control-sm"
                            placeholder="Rechercher par numéro ou ID..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                          />
                        </div>
                        <div className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {compteurs
                            .filter(c => {
                              const q = filterText.trim().toLowerCase()
                              if (!q) return true
                              return (
                                String(c.id).includes(q) ||
                                (c.numeroCompteur || '').toLowerCase().includes(q) ||
                                (c.idCompteur || '').toLowerCase().includes(q)
                              )
                            })
                            .map((c) => {
                              const checked = values.compteurId.includes(c.id)
                              return (
                                <label key={c.id} className={`list-group-item list-group-item-action d-flex align-items-center px-3 py-2 ${checked ? 'bg-primary-light' : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                  <input
                                    type="checkbox"
                                    className="form-check-input me-3"
                                    checked={checked}
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      setValues((v) => {
                                        const set = new Set(v.compteurId)
                                        if (e.target.checked) set.add(c.id)
                                        else set.delete(c.id)
                                        return { ...v, compteurId: Array.from(set) }
                                      })
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="d-flex flex-column">
                                    <span className="fw-semibold text-dark fs-sm">{c.numeroCompteur ?? c.id}</span>
                                    {(c.idCompteur) && <small className="text-muted" style={{ fontSize: '0.75rem' }}>{c.idCompteur}</small>}
                                  </div>
                                </label>
                              )
                            })}
                          {compteurs.length === 0 && (
                            <div className="text-center text-muted p-4">Aucun compteur disponible</div>
                          )}
                        </div>
                        <div className="d-flex justify-content-between p-2 border-top bg-light">
                          <div className="btn-group btn-group-sm">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setValues((v) => ({ ...v, compteurId: compteurs.map(c => c.id) }))}>Tout</button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setValues((v) => ({ ...v, compteurId: [] }))}>Aucun</button>
                          </div>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => setPickerOpen(false)}>OK</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light" style={{ flex: '0 0 auto' }}>
              <button type="button" className="btn btn-alt-secondary" onClick={onClose} disabled={!!submitting}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={!!submitting || hasValidationError}>
                <i className="fa fa-paper-plane me-1"></i> {submitting ? 'Enregistrement...' : 'Enregistrer la commande'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ position: 'fixed', inset: 0, zIndex: 1040, pointerEvents: 'none' as any, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
    </div>
  )
}

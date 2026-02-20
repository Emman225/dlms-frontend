import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { equipementService } from '../services/equipementService'
import DataTable, { type Column } from '../components/common/DataTable'
import EquipementModal, { type EquipementFormValues } from '../components/equipements/EquipementModal'
import { equipementApi, type Equipement } from '../api/equipementApi'
import { authService } from '../services/authService'
import { posteService } from '../services/posteService'
import { celluleService } from '../services/celluleService'
import { usePermissions } from '../context/PermissionContext'
import { equipementCelluleApi } from '../api/equipementCelluleApi'
import AssociateCelluleModal from '../components/equipements/AssociateCelluleModal'

export default function EquipementsList() {
  const { hasPermission } = usePermissions()
  const [rows, setRows] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Equipement | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [postes, setPostes] = useState<Array<{ id: number; libelle: string }>>([])
  const [cellules, setCellules] = useState<Array<any>>([])

  // State for associations
  const [serverAssociations, setServerAssociations] = useState<Record<number, any[]>>({})
  const [showAssociateModal, setShowAssociateModal] = useState(false)
  const [associatingEquipement, setAssociatingEquipement] = useState<Equipement | null>(null)
  const [associateSubmitting, setAssociateSubmitting] = useState(false)

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await equipementService.list()
      const data = (res?.data as any) || []
      const items = Array.isArray(data) ? data : (data?.data ?? [])
      console.log('EquipementsList: Raw items from API:', items)
      setRows(items)

      // Load associations for each equipment
      if (userId) {
        loadAssociations(items.map((i: any) => i.id), userId)
      }
    } catch (_) {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const loadAssociations = async (ids: number[], uId: string) => {
    if (!uId || ids.length === 0) return

    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await equipementCelluleApi.getByEquipementId(id, uId)
          if (res && res.isSuccess) {
            return { id, data: res.data }
          }
        } catch (e) { /* ignore */ }
        return null
      })
    )

    const newAssocs: Record<number, any[]> = {}
    results.forEach(r => {
      if (r) newAssocs[r.id] = r.data
    })
    setServerAssociations(prev => ({ ...prev, ...newAssocs }))
  }

  const loadPostes = async () => {
    try {
      const res = await posteService.list()
      const data = (res?.data as any) || []
      const items = Array.isArray(data) ? data : (data?.data ?? [])
      const mapped = items.map((p: any) => ({ id: p.id, libelle: p.libelle ?? String(p.id) }))
      setPostes(mapped)
    } catch (_) {
      setPostes([])
    }
  }

  const loadCellules = async () => {
    try {
      const res = await celluleService.list()
      const data = (res?.data as any) || []
      const items = Array.isArray(data) ? data : (data?.data ?? [])
      setCellules(items)
    } catch (_) {
      setCellules([])
    }
  }

  useEffect(() => {
    loadPostes()
    loadCellules()

      ; (async () => {
        try {
          const me = await authService.getCurrent()
          const u = (me?.data as any)?.data ?? me?.data
          const id = u?.id ?? u?.userId ?? ''
          setUserId(String(id))
        } catch (_) { }
      })()
  }, [])

  useEffect(() => {
    if (userId) {
      loadList()
    }
  }, [userId])

  const onNew = () => { setEditing(null); setShowModal(true) }
  const onEdit = (e: Equipement) => { setEditing(e); setShowModal(true) }
  const onDelete = async (e: Equipement) => {
    const ask = (window as any).Swal
    const confirm = ask
      ? await ask.fire({ icon: 'warning', title: 'Supprimer cet équipement ?', text: e.libelle, showCancelButton: true, confirmButtonText: 'Oui, supprimer' })
      : { isConfirmed: window.confirm(`Supprimer l'équipement « ${e.libelle} » ?`) }
    if (!confirm.isConfirmed) return
    try {
      setSubmitting(true)
      await equipementApi.remove({ id: e.id, deletedBy: String(userId ?? '') })
      setRows(prev => prev.filter(row => row.id !== e.id))
      ask && ask.fire({ icon: 'success', title: 'Supprimé', timer: 1200, showConfirmButton: false })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la suppression'
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (values: EquipementFormValues) => {
    try {
      setSubmitting(true)
      if (editing?.id) {
        const payload = { ...values, id: editing.id, updatedBy: userId }
        await equipementApi.edit(payload)
        setRows(prev => prev.map(row => row.id === editing.id ? { ...row, ...payload } : row))
      } else {
        const res = await equipementApi.add({ ...values, createdBy: userId })
        if (res && res.data) {
          setRows(prev => [res.data, ...prev])
        } else {
          await loadList()
        }
      }
      setShowModal(false)
      setEditing(null)
      const ask = (window as any).Swal
      ask && ask.fire({ icon: 'success', title: 'Enregistré', timer: 1200, showConfirmButton: false })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de l\'enregistrement'
      const ask = (window as any).Swal
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const onAssociate = (e: Equipement) => {
    setAssociatingEquipement(e)
    setShowAssociateModal(true)
  }

  const handleAssociateSave = async (newCelluleIds: number[]) => {
    if (!associatingEquipement) return
    try {
      setAssociateSubmitting(true)

      const currentAssocs = serverAssociations[associatingEquipement.id] || []
      const currentIds = currentAssocs.map(a => a.celluleId)

      // Ids to add: in new but not in current
      const idsToAdd = newCelluleIds.filter(id => !currentIds.includes(id))
      // Ids to remove: in current but not in new
      const idsToRemove = currentIds.filter(id => !newCelluleIds.includes(id))

      const addPromise = idsToAdd.length > 0
        ? equipementCelluleApi.add(idsToAdd.map(id => ({
          equipementId: associatingEquipement.id,
          celluleId: id,
          userId: userId,
          createdBy: userId
        })))
        : Promise.resolve();

      const removePromise = idsToRemove.length > 0
        ? equipementCelluleApi.remove(idsToRemove.map(id => ({
          equipementId: associatingEquipement.id,
          celluleId: id,
          userId: userId,
          deletedBy: userId
        })))
        : Promise.resolve();

      await Promise.all([addPromise, removePromise])

      const ask = (window as any).Swal
      ask && ask.fire({ icon: 'success', title: 'Mise à jour réussie', timer: 1200, showConfirmButton: false })

      setShowAssociateModal(false)
      setAssociatingEquipement(null)

      // Reload associations for this equipment
      loadAssociations([associatingEquipement.id], userId)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la mise à jour'
      const ask = (window as any).Swal
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setAssociateSubmitting(false)
    }
  }

  const onDissociate = (e: any) => {
    setAssociatingEquipement(e)
    setShowAssociateModal(true)
  }

  const columns = useMemo<Column<any>[]>(() => [
    { key: 'numeroSerie', title: 'N° Série' },
    { key: 'libelle', title: 'Libellé', render: (r) => <span className="fw-semibold fs-sm">{r.libelle ?? '—'}</span> },
    { key: 'adresseIp', title: 'Adresse IP' },
    { key: 'type', title: 'Type' },
    { key: 'marque', title: 'Marque' },
    { key: 'port', title: 'Port' },
    { key: 'serialPort', title: 'Serial' },
    { key: 'datePoseActuelle', title: 'Pose actuelle', render: (r) => (r.datePoseActuelle ? String(r.datePoseActuelle).substring(0, 10) : '—') },
    {
      key: 'poste',
      title: 'Poste',
      render: (r) => {
        const names = new Set<string>()

        // Helper to find a poste name by various means
        const extractPosteName = (obj: any) => {
          if (!obj) return null

          // 1. Try nested poste object labels
          const nested = obj?.poste?.libelle || obj?.poste?.nom || obj?.poste?.Label || obj?.poste?.Libelle
          if (nested) return nested

          // 2. Try direct poste label fields
          const direct = obj?.posteLibelle || obj?.libellePoste || obj?.PosteLibelle || obj?.LibellePoste
          if (typeof direct === 'string' && direct) return direct

          // 3. Try lookup by ID
          const pId = obj?.posteId || obj?.idPoste || obj?.PosteId || obj?.IdPoste || (obj?.poste && typeof obj.poste !== 'object' ? obj.poste : null)
          if (pId) {
            const found = postes.find(p => String(p.id) === String(pId))
            if (found?.libelle) return found.libelle
          }
          return null
        }

        const assocs = serverAssociations[r.id]

        if (Array.isArray(assocs)) {
          assocs.forEach(a => {
            const nameFromCell = extractPosteName(a.cellule)
            if (nameFromCell) names.add(nameFromCell)
            const nameDirect = extractPosteName(a)
            if (nameDirect) names.add(nameDirect)
          })
        } else if (assocs === undefined) {
          const directName = extractPosteName(r)
          if (directName) names.add(directName)
          if (Array.isArray(r.cellules)) {
            r.cellules.forEach((c: any) => {
              const name = extractPosteName(c)
              if (name) names.add(name)
            })
          }
        }

        if (names.size > 0) {
          return (
            <div className="d-flex flex-wrap gap-1">
              {Array.from(names).map((p, i) => (
                <span key={i} className="badge bg-info text-white fw-bold">{p}</span>
              ))}
            </div>
          )
        }
        return '—'
      }
    },
    {
      key: 'cellule',
      title: 'Cellule',
      render: (r) => {
        const names = new Set<string>()
        const assocs = serverAssociations[r.id]

        const extractCelluleName = (obj: any) => {
          if (!obj) return null

          // 1. Try nested cellule object labels
          const nested = obj?.cellule?.libelle || obj?.cellule?.nom || obj?.cellule?.Label || obj?.cellule?.Libelle
          if (nested) return nested

          // 2. Try direct cellule label fields
          const direct = obj?.celluleLibelle || obj?.libelleCellule || obj?.LibelleCellule || obj?.CelluleLibelle || obj?.libelle
          if (typeof direct === 'string' && direct) return direct

          // 3. Try lookup by ID
          const cId = obj?.celluleId || obj?.idCellule || obj?.CelluleId || obj?.IdCellule || (obj?.cellule && typeof obj.cellule !== 'object' ? obj.cellule : null)
          if (cId) {
            const found = cellules.find(c => String(c.id) === String(cId))
            if (found?.libelle) return found.libelle
          }
          return null
        }

        if (Array.isArray(assocs)) {
          assocs.forEach(a => {
            const name = extractCelluleName(a)
            if (name) names.add(name)
          })
        } else if (assocs === undefined) {
          const directName = extractCelluleName(r)
          if (directName) names.add(directName)
          if (Array.isArray(r.cellules)) {
            r.cellules.forEach((c: any) => {
              const name = extractCelluleName(c)
              if (name) names.add(name)
            })
          }
        }

        if (names.size > 0) {
          return (
            <div className="d-flex flex-wrap gap-1">
              {Array.from(names).map((c, i) => (
                <span key={i} className="badge bg-primary text-white fw-bold">{c}</span>
              ))}
            </div>
          )
        }
        return '—'
      }
    },
  ], [serverAssociations, postes, cellules])

  return (
    <MainLayout fullWidth>
      <div className="content content-full">
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">Liste équipements</h3>
            <div className="block-options">
              {hasPermission('Créer un équipement') && (
                <button className="btn btn-sm btn-success" onClick={onNew}>
                  <i className="fa-solid fa-plus me-1"></i> Nouveau
                </button>
              )}
            </div>
          </div>
          <div className="block-content block-content-full">
            <DataTable
              title="Équipements"
              columns={columns}
              rows={rows}
              loading={loading}
              actions={(e: any) => {
                const assocs = serverAssociations[e.id] || []
                const isAssociated = assocs.length > 0

                return (
                  <>
                    {!isAssociated ? (
                      <button className="btn btn-sm btn-alt-info" onClick={() => onAssociate(e)} title="Associer des cellules">
                        <i className="fa-solid fa-link"></i>
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-alt-danger" onClick={() => onDissociate(e)} title="Dissocier cellules">
                        <i className="fa-solid fa-link-slash"></i>
                      </button>
                    )}
                    {hasPermission('Modifier un équipement') && (
                      <button className="btn btn-sm btn-alt-secondary" onClick={() => onEdit(e)} title="Editer">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                    )}
                    {hasPermission('Supprimer un équipement') && (
                      <button className="btn btn-sm btn-alt-danger" onClick={() => onDelete(e)} disabled={submitting} title="Supprimer">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </>
                )
              }}
            />
          </div>
        </div>
      </div>
      <EquipementModal
        show={showModal}
        onClose={() => { if (!submitting) { setShowModal(false); setEditing(null) } }}
        onSubmit={handleSubmit}
        initial={editing ?? undefined}
        submitting={submitting}
      />
      <AssociateCelluleModal
        show={showAssociateModal}
        onClose={() => setShowAssociateModal(false)}
        onSave={handleAssociateSave}
        equipement={associatingEquipement}
        cellules={cellules}
        submitting={associateSubmitting}
        initialSelectedIds={associatingEquipement ? (serverAssociations[associatingEquipement.id] || []).map(a => a.celluleId) : []}
      />
    </MainLayout>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { compteurService } from '../services/compteurService'
import DataTable, { type Column } from '../components/common/DataTable'
import CompteurModal, { type CompteurFormValues } from '../components/compteurs/CompteurModal'
import { compteurApi, type Compteur } from '../api/compteurApi'
import { authService } from '../services/authService'
import { fabricantService } from '../services/fabricantService'
import { equipementService } from '../services/equipementService'
import { compteurEquipementApi } from '../api/compteurEquipementApi'
import { compteurCelluleApi } from '../api/compteurCelluleApi'
import { celluleService } from '../services/celluleService'
import { posteService } from '../services/posteService'
import AssociateCelluleToCompteurModal from '../components/compteurs/AssociateCelluleToCompteurModal'
import api from '../api/apiClient'
import { usePermissions } from '../context/PermissionContext'

export default function CompteursList() {
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()
  const [rows, setRows] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | number | null>(null)
  const [serverAssociations, setServerAssociations] = useState<Record<number, any>>({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Compteur | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fabricants, setFabricants] = useState<Array<{ id: number; libelle: string }>>([])
  const [typecommandes, setTypecommandes] = useState<Array<{ id: number; libelletype: string }>>([])
  const [activeTab, setActiveTab] = useState<'compteurs' | 'stats' | 'events'>('compteurs')
  const [selected, setSelected] = useState<Record<string | number, boolean>>({})
  const [showCommandeModal, setShowCommandeModal] = useState(false)
  const [commandeSubmitting, setCommandeSubmitting] = useState(false)
  const [commandeIds, setCommandeIds] = useState<Array<string | number>>([])
  const [commandeForm, setCommandeForm] = useState({
    libellecommande: '',
    dateexec: '',
    datefin: '',
    numeroprofile: 0,
    nombreentree: 0,
    datedebut: '',
    dateexp: '',
    typecommandeId: 0,
  })
  const [equipements, setEquipements] = useState<Array<any>>([])
  const [postes, setPostes] = useState<Array<{ id: number; libelle: string }>>([])
  const [showAssociateModal, setShowAssociateModal] = useState(false)
  const [associatingCompteur, setAssociatingCompteur] = useState<Compteur | null>(null)
  const [selectedEquipementId, setSelectedEquipementId] = useState<number>(0)
  const [associateSubmitting, setAssociateSubmitting] = useState(false)
  // State for cellule associations
  const [cellules, setCellules] = useState<Array<any>>([])
  const [showCelluleModal, setShowCelluleModal] = useState(false)
  const [associatingCelluleCompteur, setAssociatingCelluleCompteur] = useState<Compteur | null>(null)
  const [celluleAssocSubmitting, setCelluleAssocSubmitting] = useState(false)

  // In-memory only: used for immediate visual feedback after association, cleared when server data arrives
  const [localAssociations, setLocalAssociations] = useState<Record<number, { id: number; libelle: string; adresseIp?: string }>>({})

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await compteurService.list()
      const body = res?.data as any

      let items: any[] = []
      if (Array.isArray(body)) {
        items = body
      } else if (body && Array.isArray(body.data)) {
        items = body.data
      } else if (body && body.data && Array.isArray(body.data.data)) {
        items = body.data.data
      } else if (body && body.data && Array.isArray(body.data.items)) {
        items = body.data.items
      } else if (body && Array.isArray(body.response)) {
        items = body.response
      }

      // The server may return soft-deleted cellule associations in the cellules array.
      // Verify active associations via the junction endpoint for compteurs that have cellules.
      let uid = userId
      if (!uid) {
        try {
          const profile = JSON.parse(localStorage.getItem('user_profile') || '{}')
          uid = profile.id || profile.UtilisateurId || null
        } catch { /* ignore */ }
      }
      const withCellules = items.filter((c: any) => ((c.cellules as any[]) || []).length > 0)
      if (withCellules.length > 0 && uid) {
        const results = await Promise.allSettled(
          withCellules.map(async (c: any) => {
            const r = await compteurCelluleApi.getByCompteurId(c.id, String(uid))
            const arr = Array.isArray(r) ? r : (r?.data ?? [])
            const activeIds = new Set(
              (arr as any[])
                .filter((j: any) => !j.isArchive && !j.deletedAt)
                .map((j: any) => j.celluleId ?? j.CelluleId)
            )
            return { compteurId: c.id, activeIds }
          })
        )
        const activeMap = new Map<number, Set<number>>()
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            activeMap.set(withCellules[i].id, r.value.activeIds)
          }
        })
        items = items.map((c: any) => {
          const activeIds = activeMap.get(c.id)
          if (activeIds === undefined) return c
          const cellules = ((c.cellules as any[]) || []).filter((cell: any) => activeIds.has(cell.id))
          return { ...c, cellules }
        })
      }

      setRows(items)
      // Clear optimistic local associations — server data is now authoritative
      setLocalAssociations({})
    } catch (err) {
      console.error('CompteursList: Error loading list', err)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const loadFabricants = async () => {
    try {
      const res = await fabricantService.list()
      const data = (res?.data as any) || []
      const items = Array.isArray(data) ? data : (data?.data ?? [])
      const mapped = items.map((f: any) => ({ id: f.id, libelle: f.libelle ?? String(f.id) }))
      setFabricants(mapped)
    } catch (_) {
      setFabricants([])
    }
  }

  const loadTypecommandes = async () => {
    try {
      const res = await api.get('/Typecommande')
      const data = (res?.data as any) || {}
      const items = Array.isArray(data) ? data : (data?.data ?? [])
      const mapped = items.map((t: any) => ({ id: Number(t.id), libelletype: String(t.libelletype ?? t.id) }))
      setTypecommandes(mapped)
    } catch (_) {
      setTypecommandes([])
    }
  }

  const loadEquipements = async () => {
    try {
      const res = await equipementService.list()
      const data = (res?.data as any) || []
      const items = Array.isArray(data) ? data : (data?.data ?? [])
      setEquipements(items)
    } catch (_) {
      setEquipements([])
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

  const loadAssociations = async (compteurIds: number[], currentUserId: string) => {
    if (!currentUserId || compteurIds.length === 0) return;

    // Fetch associations in batches or all at once (User requested per ID call)
    const promises = compteurIds.map(async (id) => {
      try {
        const res = await compteurEquipementApi.getByIdCompteur(id, currentUserId);
        if (res && res.isSuccess && res.data && res.data.length > 0) {
          // Filter out archived/soft-deleted records
          const valid = res.data.filter((d: any) => !d.isArchive && !d.deletedAt);
          if (valid.length > 0) {
            return { id, data: valid[0] };
          }
        }
      } catch (e) { /* ignore */ }
      return null;
    });

    const results = await Promise.all(promises);
    const newAssocs: Record<number, any> = {};
    results.forEach(r => {
      if (r) newAssocs[r.id] = r.data;
    });

    setServerAssociations(prev => ({ ...prev, ...newAssocs }));
  }

  useEffect(() => {
    // Clean up any stale localStorage data from previous versions
    localStorage.removeItem('dlms_compteur_equipements');

    // Parallelize loads without blocking initial render with Promise.all
    loadList();
    loadFabricants();
    loadTypecommandes();
    loadEquipements();
    loadCellules();
    loadPostes();

    (async () => {
      try {
        const me = await authService.getCurrent()
        const root = (me?.data as any)
        const u = root?.data ?? root
        const idCandidate = u?.id ?? u?.userId ?? u?.user?.id ?? u?.user?.userId ?? u?.data?.id ?? u?.data?.userId ?? null
        if (idCandidate != null && idCandidate !== '') {
          setUserId(String(idCandidate))
        } else {
          setUserId('')
        }
      } catch (_) {
        setUserId('')
      }
    })()
  }, [])

  useEffect(() => {
    if (rows.length > 0 && userId && typeof userId === 'string' && userId !== '') {
      // Only fetch if not already in serverAssociations (use undefined check to allow null/false to block re-fetch)
      const idsToFetch = rows.map(r => r.id).filter(id => serverAssociations[id] === undefined);
      if (idsToFetch.length > 0) {
        loadAssociations(idsToFetch, userId);
      }
    }
  }, [rows, userId])

  const onNew = () => { setEditing(null); setShowModal(true) }
  const onEdit = (c: Compteur) => { setEditing(c); setShowModal(true) }
  const onDelete = async (c: Compteur) => {
    const ask = (window as any).Swal
    const confirm = ask
      ? await ask.fire({ icon: 'warning', title: 'Supprimer ce compteur ?', text: c.numeroCompteur, showCancelButton: true, confirmButtonText: 'Oui, supprimer' })
      : { isConfirmed: window.confirm(`Supprimer le compteur « ${c.numeroCompteur} » ?`) }
    if (!confirm.isConfirmed) return
    try {
      setSubmitting(true)
      await compteurApi.remove({ id: c.id, deletedBy: String(userId ?? '') })

      // OPTIMIZATION: Update local state instead of full reload
      setRows(prev => prev.filter(row => row.id !== c.id))

      ask && ask.fire({ icon: 'success', title: 'Supprimé', timer: 1200, showConfirmButton: false, didOpen: (el: HTMLElement) => { el.style.zIndex = '4000' } })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la suppression'
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg, didOpen: (el: HTMLElement) => { el.style.zIndex = '4000' } }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (values: CompteurFormValues) => {
    try {
      setSubmitting(true)
      if (editing?.id) {
        const updatedCompteur = {
          id: editing.id,
          idCompteur: values.idCompteur,
          numeroCompteur: values.numeroCompteur,
          marqueCompteur: values.marqueCompteur,
          datePremierePose: values.datePremierePose,
          datePoseActuelle: values.datePoseActuelle,
          typecompteur: values.typecompteur,
          fabriquantId: values.fabriquantId,
          etatcontacteur: values.etatcontacteur,
          updatedBy: String(userId ?? ''),
        };
        await compteurApi.edit(updatedCompteur)

        // OPTIMIZATION: Update local state
        setRows(prev => prev.map(row => row.id === editing.id ? { ...row, ...updatedCompteur } : row))
      } else {
        const res = await compteurApi.add({
          idCompteur: values.idCompteur,
          numeroCompteur: values.numeroCompteur,
          marqueCompteur: values.marqueCompteur,
          datePremierePose: values.datePremierePose,
          datePoseActuelle: values.datePoseActuelle,
          typecompteur: values.typecompteur,
          fabriquantId: values.fabriquantId,
          etatcontacteur: values.etatcontacteur,
          createdBy: String(userId ?? ''),
        })

        // If API returns the new item, we add it, else we reload to be safe but usually we should get it
        if (res && res.data) {
          setRows(prev => [res.data, ...prev])
        } else {
          await loadList()
        }
      }
      setShowModal(false)
      setEditing(null)
      const ask = (window as any).Swal
      ask && ask.fire({ icon: 'success', title: 'Enregistré', timer: 1200, showConfirmButton: false, didOpen: (el: HTMLElement) => { el.style.zIndex = '4000' } })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de l\'enregistrement'
      const ask = (window as any).Swal
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg, didOpen: (el: HTMLElement) => { el.style.zIndex = '4000' } }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const onAssociate = (c: Compteur) => {
    setAssociatingCompteur(c)
    setSelectedEquipementId(0)
    setShowAssociateModal(true)
  }

  const handleAssociateSave = async () => {
    if (!associatingCompteur || !selectedEquipementId) {
      const ask = (window as any).Swal
      const msg = 'Veuillez sélectionner un équipement'
      ask ? ask.fire({ icon: 'warning', title: 'Attention', text: msg }) : alert(msg)
      return
    }

    try {
      setAssociateSubmitting(true)
      const payload = [
        {
          compteurId: associatingCompteur.id,
          equipementId: Number(selectedEquipementId),
          createdBy: String(userId ?? ''),
        }
      ]
      const res = await compteurEquipementApi.associate(payload)

      if (res && res.isSuccess === false) {
        throw new Error(res.message || 'L\'association a échoué côté serveur')
      }

      const ask = (window as any).Swal
      if (ask) {
        await ask.fire({ icon: 'success', title: 'Association réussie', timer: 1500, showConfirmButton: false, didOpen: (el: HTMLElement) => { el.style.zIndex = '4000' } })
      } else {
        alert('Association réussie')
      }

      const selectedEq = equipements.find(e => e.id === Number(selectedEquipementId));
      setLocalAssociations(prev => ({
        ...prev,
        [associatingCompteur.id]: {
          id: Number(selectedEquipementId),
          libelle: selectedEq?.libelle || `Equipement #${selectedEquipementId}`,
          adresseIp: selectedEq?.adresseIp
        }
      }))

      setShowAssociateModal(false)
      setAssociatingCompteur(null)
      setSelectedEquipementId(0)

      // OPTIMIZATION: Update rows state locally for immediate feedback
      setRows(prev => prev.map(row => row.id === associatingCompteur.id ? {
        ...row,
        equipementId: Number(selectedEquipementId),
        equipementLibelle: selectedEq?.libelle,
        equipementName: selectedEq?.libelle,
        libelleEquipement: selectedEq?.libelle
      } : row));

      // Recharger la liste pour voir les changements
      await loadList()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de l\'association'
      const ask = (window as any).Swal
      if (ask) {
        ask.fire({ icon: 'error', title: 'Erreur', text: msg, didOpen: (el: HTMLElement) => { el.style.zIndex = '4000' } })
      } else {
        alert(msg)
      }
    } finally {
      setAssociateSubmitting(false)
    }
  }

  const onDissociate = async (c: any) => {
    const ask = (window as any).Swal
    const local = localAssociations[c.id];
    const serverAssoc = serverAssociations[c.id];
    const hasAssocObj = (c.compteurEquipements && c.compteurEquipements.length > 0) || c.compteurEquipement || c.equipement || c.CompteurEquipement || (c.CompteurEquipements && c.CompteurEquipements.length > 0);

    const eqId = local?.id ||
      c.equipementId ||
      c.idEquipement ||
      (hasAssocObj && (hasAssocObj.equipementId || hasAssocObj.idEquipement || (hasAssocObj.id && hasAssocObj.id !== c.id))) ||
      serverAssoc?.equipementId;

    if (!eqId) {
      const msg = "Impossible de déterminer l'ID de l'équipement pour la dissociation."
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
      return
    }

    const confirm = ask
      ? await ask.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous vraiment dissocier le compteur "${c.numeroCompteur}" de son équipement ? Cette action est irréversible.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, dissocier !',
        cancelButtonText: 'Annuler'
      })
      : { isConfirmed: window.confirm(`Voulez-vous vraiment dissocier le compteur « ${c.numeroCompteur} » ?`) }

    if (!confirm.isConfirmed) return

    try {
      setSubmitting(true)
      const payload = [
        {
          compteurId: c.id,
          equipementId: Number(eqId),
          userId: String(userId ?? ''),
          deletedBy: String(userId ?? '')
        }
      ]
      await compteurEquipementApi.remove(payload)

      // Mise à jour de l'état local pour refléter la dissociation immédiatement
      setLocalAssociations(prev => {
        const next = { ...prev };
        delete next[c.id];
        return next;
      });
      setServerAssociations(prev => {
        const next = { ...prev };
        next[c.id] = null; // Mark as explicitly empty to prevent re-fetch loop
        return next;
      });

      // OPTIMIZATION: Manually clear association fields in the rows state for immediate feedback
      setRows(prev => prev.map(row => row.id === c.id ? {
        ...row,
        equipementId: null,
        idEquipement: null,
        equipementName: null,
        equipementLibelle: null,
        libelleEquipement: null,
        compteurEquipements: [],
        compteurEquipement: null,
        equipement: null,
        CompteurEquipement: null,
        CompteurEquipements: []
      } : row));

      ask && ask.fire({ icon: 'success', title: 'Dissocié', timer: 1200, showConfirmButton: false })

      // Small delay before reloading to give backend time to settle
      setTimeout(() => {
        loadList();
      }, 1000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la dissociation'
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }


  const onAssociateCellule = (c: Compteur) => {
    setAssociatingCelluleCompteur(c)
    setShowCelluleModal(true)
  }

  const handleCelluleAssocSave = async (celluleId: number) => {
    if (!associatingCelluleCompteur || !celluleId) {
      const ask = (window as any).Swal
      const msg = 'Veuillez sélectionner une cellule'
      ask ? ask.fire({ icon: 'warning', title: 'Attention', text: msg }) : alert(msg)
      return
    }
    try {
      setCelluleAssocSubmitting(true)
      const payload = [{
        compteurId: associatingCelluleCompteur.id,
        celluleId: celluleId,
        userId: String(userId ?? ''),
        createdBy: String(userId ?? '')
      }]
      const res = await compteurCelluleApi.add(payload)
      if (res && res.isSuccess === false) {
        throw new Error(res.message || "L'association a échoué")
      }

      // Immediately update local row state so the button switches to "Dissocier"
      const selectedCell = cellules.find(cl => cl.id === celluleId)
      if (selectedCell) {
        setRows(prev => prev.map(row => row.id === associatingCelluleCompteur.id
          ? { ...row, cellules: [...(row.cellules || []), selectedCell] }
          : row
        ))
      }

      const ask = (window as any).Swal
      ask && ask.fire({ icon: 'success', title: 'Association réussie', timer: 1500, showConfirmButton: false, didOpen: (el: HTMLElement) => { el.style.zIndex = '4000' } })
      setShowCelluleModal(false)
      setAssociatingCelluleCompteur(null)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Erreur lors de l'association"
      const ask = (window as any).Swal
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg, didOpen: (el: HTMLElement) => { el.style.zIndex = '4000' } }) : alert(msg)
    } finally {
      setCelluleAssocSubmitting(false)
    }
  }

  const onDissociateCellule = async (c: any) => {
    const ask = (window as any).Swal
    const cls = getActiveCellules(c)
    if (cls.length === 0) {
      const msg = "Aucune cellule associée à ce compteur."
      ask ? ask.fire({ icon: 'info', title: 'Info', text: msg }) : alert(msg)
      return
    }
    const confirm = ask
      ? await ask.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous vraiment dissocier le compteur "${c.numeroCompteur}" de sa cellule ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, dissocier !',
        cancelButtonText: 'Annuler'
      })
      : { isConfirmed: window.confirm(`Dissocier le compteur « ${c.numeroCompteur} » de sa cellule ?`) }
    if (!confirm.isConfirmed) return

    try {
      setCelluleAssocSubmitting(true)
      const payload = cls.map((cell: any) => ({
        compteurId: c.id,
        celluleId: cell.id,
        userId: String(userId ?? ''),
        deletedBy: String(userId ?? '')
      }))
      await compteurCelluleApi.remove(payload)

      // Update local row state: clear cellules and junction records so the button switches to "Associer"
      setRows(prev => prev.map(row => row.id === c.id
        ? { ...row, cellules: [], compteurCellules: [], CompteurCellules: [] }
        : row
      ))

      ask && ask.fire({ icon: 'success', title: 'Dissocié', timer: 1200, showConfirmButton: false })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la dissociation'
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setCelluleAssocSubmitting(false)
    }
  }

  const allSelected = useMemo(() => rows.length > 0 && rows.every((r: any) => !!selected[r.idCompteur]), [rows, selected])

  const toggleAll = () => {
    if (allSelected) {
      setSelected({})
    } else {
      const next: Record<string | number, boolean> = {}
      rows.forEach((r: any) => { if (r?.idCompteur != null && r.idCompteur !== '') next[r.idCompteur] = true })
      setSelected(next)
    }
  }

  const toggleOne = (idCompteur: string | number) => {
    setSelected((s) => ({ ...s, [idCompteur]: !s[idCompteur] }))
  }

  const selectedIds = useMemo(() => rows
    .filter((r) => selected[r.idCompteur])
    .map((r) => r.idCompteur)
    .filter((v: any) => v != null && v !== '')
    , [rows, selected])
  const selectedCount = selectedIds.length

  const openCommandeForAll = () => {
    const ids = rows
      .map((r: any) => r.idCompteur)
      .filter((v: any) => v != null && v !== '')
    setCommandeIds(ids)
    setShowCommandeModal(true)
  }

  const openCommandeForSelected = () => {
    if (selectedCount === 0) return
    setCommandeIds(selectedIds)
    setShowCommandeModal(true)
  }

  const handleCommandeSave = async () => {
    try {
      setCommandeSubmitting(true)
      const createdByVal = userId != null ? String(userId).trim() : ''
      if (!createdByVal) {
        throw new Error('Utilisateur non identifié (createdBy manquant).')
      }
      const typeId = Number(commandeForm.typecommandeId)
      if (!typeId || Number.isNaN(typeId) || typeId <= 0) {
        throw new Error('Veuillez sélectionner un type de commande.')
      }
      // L'API attend des idCompteur alphanumériques (ex: "APAESX3058012430")
      // On envoie donc des chaînes non vides
      const idsStr = (commandeIds || [])
        .map((v: any) => String(v).trim())
        .filter((s) => s.length > 0)
      if (idsStr.length === 0) {
        throw new Error('Veuillez sélectionner au moins un compteur valide.')
      }
      const payload = {
        libellecommande: commandeForm.libellecommande,
        dateexec: commandeForm.dateexec || new Date().toISOString(),
        datefin: commandeForm.datefin || new Date().toISOString(),
        numeroprofile: Number(commandeForm.numeroprofile) || 0,
        nombreentree: Number(commandeForm.nombreentree) || 0,
        datedebut: commandeForm.datedebut || new Date().toISOString(),
        dateexp: commandeForm.dateexp || new Date().toISOString(),
        typecommandeId: typeId,
        compteurId: idsStr,
        createdBy: createdByVal,
      }
      await api.post('/Commande/add', payload)
      setShowCommandeModal(false)
      setCommandeIds([])
      setCommandeForm({ libellecommande: '', dateexec: '', datefin: '', numeroprofile: 0, nombreentree: 0, datedebut: '', dateexp: '', typecommandeId: 0 })
      const ask = (window as any).Swal
      ask && ask.fire({ icon: 'success', title: 'Commande créée', timer: 1200, showConfirmButton: false, didOpen: (el: HTMLElement) => { el.style.zIndex = '4000' } })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la création de la commande'
      const ask = (window as any).Swal
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setCommandeSubmitting(false)
    }
  }

  // Helper: get active cellules from row data (filter out soft-deleted/archived associations)
  const getActiveCellules = (r: any): any[] => {
    // Check junction table records if available to determine active associations
    const junctionRecords = r.compteurCellules || r.CompteurCellules || []
    if (junctionRecords.length > 0) {
      // Use junction records: only keep cellules whose junction entry is active
      const activeCelluleIds = new Set(
        junctionRecords
          .filter((j: any) => !j.isArchive && !j.deletedAt)
          .map((j: any) => j.celluleId ?? j.CelluleId)
      )
      if (activeCelluleIds.size === 0) return []
      const raw = (r.cellules as any[] | undefined) || []
      return raw.filter((c: any) => activeCelluleIds.has(c.id))
    }
    // Fallback: filter directly on cellule objects
    const raw = (r.cellules as any[] | undefined) || []
    return raw.filter((c: any) => !c.isArchive && !c.deletedAt)
  }

  const columns = useMemo<Column<any>[]>(() => [
    {
      key: '_select',
      title: (
        <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} />
      ),
      width: 40,
      align: 'center',
      render: (r) => (
        <input type="checkbox" aria-label={`Select ${r.idCompteur}`} checked={!!selected[r.idCompteur]} onChange={() => toggleOne(r.idCompteur)} />
      ),
    },
    { key: 'idCompteur', title: 'ID COMPTEUR' },
    {
      key: 'numeroCompteur',
      title: 'NUMÉRO DE SÉRIE',
      render: (r) => (
        <button
          className="btn btn-link p-0 text-decoration-none"
          onClick={() => navigate(`/lecture/lectures?numeroCompteur=${encodeURIComponent(r.numeroCompteur ?? '')}`)}
        >
          {r.numeroCompteur ?? '—'}
        </button>
      ),
    },
    { key: 'datePremierePose', title: "DATE D'INSCRIPTION", render: (r) => (r.datePremierePose ? String(r.datePremierePose).substring(0, 10) : '—') },
    {
      key: 'posteLibelle', title: 'POSTE', render: (r) => {
        const extractPosteName = (obj: any) => {
          if (!obj) return null
          const nested = obj?.poste?.libelle || obj?.poste?.nom || obj?.poste?.Libelle
          if (nested) return nested
          const direct = obj?.posteLibelle || obj?.libellePoste || obj?.PosteLibelle || obj?.LibellePoste
          if (typeof direct === 'string' && direct) return direct
          const pId = obj?.posteId || obj?.idPoste || obj?.PosteId || (obj?.poste && typeof obj.poste !== 'object' ? obj.poste : null)
          if (pId) {
            const found = postes.find(p => String(p.id) === String(pId))
            if (found?.libelle) return found.libelle
          }
          return null
        }
        const cls = getActiveCellules(r)
        if (cls.length > 0) {
          const names = [...new Set(cls.map(c => extractPosteName(c)).filter(Boolean))]
          return names.length > 0 ? names.join(', ') : '—'
        }
        return '—'
      }
    },
    {
      key: 'celluleLibelle', title: 'CELLULE', render: (r) => {
        const cls = getActiveCellules(r)
        if (cls.length > 0) {
          const names = cls.map(c => c.libelle).filter(Boolean)
          return names.length > 0 ? names.join(', ') : '—'
        }
        return '—'
      }
    },
    {
      key: 'celluleType', title: 'TYPE', render: (r) => {
        const cls = getActiveCellules(r)
        if (cls.length > 0) {
          const types = cls.map(c => c.type).filter((t: any) => t != null && t !== '')
          return types.length > 0 ? types.join(', ') : '—'
        }
        return '—'
      }
    },
    {
      key: 'celluleValeurTension', title: 'TENSION', render: (r) => {
        const cls = getActiveCellules(r)
        if (cls.length > 0) {
          const vals = cls.map(c => c.valeurTension).filter((v: any) => v != null && v !== '' && v !== '0')
          return vals.length > 0 ? vals.join(', ') : '—'
        }
        return '—'
      }
    },
    {
      key: 'equipement',
      title: 'ÉQUIPEMENT',
      render: (r) => {
        // Priorité : Etat local (immédiat après association), puis les différentes formes de retour API (imbriquées ou plates)
        const local = localAssociations[r.id];
        const serverAssoc = serverAssociations[r.id];

        // Find equipment details if we have equipmentId but no name (from serverAssoc)
        const equipFromStore = serverAssoc?.equipementId ? equipements.find(e => String(e.id) === String(serverAssoc.equipementId)) : null;

        const association = local ? { equipement: local } :
          (r.compteurEquipements?.[0] || r.compteurEquipement || r.equipement || r.CompteurEquipement || r.CompteurEquipements?.[0] ||
            (serverAssoc ? { equipement: equipFromStore || { id: serverAssoc.equipementId } } : null));

        // Extraction du nom/libellé de l'équipement
        const name = local?.libelle ||
          r.equipementName ||
          r.equipementLibelle ||
          r.libelleEquipement ||
          association?.equipement?.libelle ||
          association?.libelle ||
          association?.Libelle ||
          equipFromStore?.libelle ||
          (typeof r.equipement === 'string' ? r.equipement : null);

        // Extraction de l'adresse IP
        const ip = local?.adresseIp ||
          association?.equipement?.adresseIp ||
          association?.adresseIp ||
          association?.AdresseIp ||
          association?.adresse_ip ||
          r.equipementAdresseIp ||
          r.adresseIpEquipement ||
          equipFromStore?.adresseIp;

        if (name || ip || r.equipementId || association?.equipementId || association?.id || serverAssoc?.equipementId) {
          const displayedId = local?.id || r.equipementId || association?.equipementId || association?.id || serverAssoc?.equipementId;
          return (
            <div className="d-flex align-items-center py-1">
              <div className="rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{ width: '32px', height: '32px', backgroundColor: '#e3f2fd', color: '#0d6efd', border: '1px solid #bbdefb' }}>
                <i className="fa-solid fa-tablet-screen-button" style={{ fontSize: '0.8rem' }}></i>
              </div>
              <div>
                <div className="fw-bold text-dark fs-sm" style={{ lineHeight: '1.2' }}>{name || 'Équipement'}</div>
                {ip && <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: '500' }}>IP: {ip}</div>}
                {!ip && displayedId && (displayedId !== r.id) && (
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>ID: {displayedId}</div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="d-flex align-items-center text-muted opacity-60 py-1">
            <i className="fa-solid fa-link-slash me-2" style={{ fontSize: '0.8rem' }}></i>
            <span className="fs-xs italic text-uppercase fw-medium" style={{ letterSpacing: '0.5px' }}>Non configuré</span>
          </div>
        );
      }
    },



  ], [allSelected, selected, fabricants, localAssociations, serverAssociations, equipements, postes])

  return (
    <MainLayout fullWidth={true}>
      <div className="content content-full content-wider">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'compteurs' ? 'active' : ''}`} onClick={() => setActiveTab('compteurs')}>Compteurs</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Statistiques</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Evénements</button>
          </li>
        </ul>

        <div className="block block-rounded mt-3">
          <div className="block-header block-header-default">
            <h3 className="block-title">Liste compteurs</h3>
            <div className="block-options">
              {activeTab === 'compteurs' && hasPermission('Créer un compteur') && (
                <button className="btn btn-sm btn-success" onClick={onNew}>
                  <i className="fa-solid fa-plus me-1"></i> Ajouter Compteur
                </button>
              )}
            </div>
          </div>
          <div className="block-content block-content-full">
            {activeTab === 'compteurs' && (
              <DataTable
                title="Compteurs"
                columns={columns}
                rows={rows}
                loading={loading}
                actions={(c: any) => {
                  const hasLocal = !!localAssociations[c.id];
                  const hasServer = !!serverAssociations[c.id];
                  // Filter out archived/soft-deleted associations from row data
                  const activeEquipAssocs = (c.compteurEquipements || c.CompteurEquipements || []).filter((a: any) => !a.isArchive && !a.deletedAt);
                  const hasAssocObj = activeEquipAssocs.length > 0 ||
                    (c.compteurEquipement && !c.compteurEquipement.isArchive && !c.compteurEquipement.deletedAt) ||
                    (c.CompteurEquipement && !c.CompteurEquipement.isArchive && !c.CompteurEquipement.deletedAt) ||
                    (c.equipement && !c.equipement.isArchive && !c.equipement.deletedAt);
                  const hasAssocId = c.equipementId || c.idEquipement || (hasAssocObj && (hasAssocObj.equipementId || hasAssocObj.idEquipement || (hasAssocObj.id && hasAssocObj.id !== c.id)));
                  const isAssociated = hasLocal || hasServer || !!(hasAssocObj || hasAssocId || c.equipementName || c.equipementLibelle || c.libelleEquipement);

                  const activeCellules = getActiveCellules(c)
                  const isCelluleAssociated = activeCellules.length > 0

                  return (
                    <>
                      {!isAssociated ? (
                        hasPermission('Créer une association compteur-équipement') && (
                          <button
                            className="btn btn-sm btn-alt-info"
                            onClick={() => onAssociate(c)}
                            title="Associer à un équipement"
                          >
                            <i className="fa-solid fa-link"></i>
                          </button>
                        )
                      ) : (
                        hasPermission('Supprimer une association compteur-équipement') && (
                          <button
                            className="btn btn-sm btn-alt-danger"
                            onClick={() => onDissociate(c)}
                            title="Dissocier de l'équipement"
                            disabled={submitting}
                          >
                            <i className="fa-solid fa-link-slash"></i>
                          </button>
                        )
                      )}
                      {!isCelluleAssociated ? (
                        <button
                          className="btn btn-sm btn-alt-success"
                          onClick={() => onAssociateCellule(c)}
                          title="Associer à une cellule"
                        >
                          <i className="fa-solid fa-plug"></i>
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-alt-warning"
                          onClick={() => onDissociateCellule(c)}
                          title="Dissocier de la cellule"
                          disabled={celluleAssocSubmitting}
                        >
                          <i className="fa-solid fa-plug-circle-xmark"></i>
                        </button>
                      )}
                      {hasPermission('Modifier un compteur') && (
                        <button className="btn btn-sm btn-alt-secondary" onClick={() => onEdit(c)} title="Editer">
                          <i className="fa-solid fa-pen"></i>
                        </button>
                      )}
                      {hasPermission('Supprimer un compteur') && (
                        <button className="btn btn-sm btn-alt-danger" onClick={() => onDelete(c)} disabled={submitting} title="Supprimer">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      )}
                    </>
                  );
                }}
              />
            )}
            {activeTab === 'compteurs' && rows.length > 0 && hasPermission('Créer une commande') && (
              <div className="mt-3">
                {selectedCount === rows.length ? (
                  <button className="btn btn-primary" onClick={openCommandeForAll}>Créer une commande pour tous</button>
                ) : selectedCount > 0 ? (
                  <button className="btn btn-outline-primary" onClick={openCommandeForSelected}>Créer une commande pour les compteurs sélectionnés</button>
                ) : null}
              </div>
            )}
            {activeTab === 'stats' && (
              <div>Statistiques</div>
            )}
            {activeTab === 'events' && (
              <div>Evénements</div>
            )}
          </div>
        </div>
      </div>
      <CompteurModal
        show={showModal}
        onClose={() => { if (!submitting) { setShowModal(false); setEditing(null) } }}
        onSubmit={handleSubmit}
        initial={editing ?? undefined}
        submitting={submitting}
        fabricants={fabricants}
      />

      {showCommandeModal && (
        <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Créer une commande</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => !commandeSubmitting && setShowCommandeModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Libellé</label>
                    <input className="form-control" value={commandeForm.libellecommande} onChange={(e) => setCommandeForm({ ...commandeForm, libellecommande: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Type de commande</label>
                    <select className="form-control" value={commandeForm.typecommandeId} onChange={(e) => setCommandeForm({ ...commandeForm, typecommandeId: Number(e.target.value) })}>
                      <option value={0}>Sélectionner...</option>
                      {typecommandes.map((t) => (
                        <option key={t.id} value={t.id}>{t.libelletype}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date exécution</label>
                    <input type="datetime-local" className="form-control" value={commandeForm.dateexec} onChange={(e) => setCommandeForm({ ...commandeForm, dateexec: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date fin</label>
                    <input type="datetime-local" className="form-control" value={commandeForm.datefin} onChange={(e) => setCommandeForm({ ...commandeForm, datefin: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Numéro profile</label>
                    <input type="number" className="form-control" value={commandeForm.numeroprofile} onChange={(e) => setCommandeForm({ ...commandeForm, numeroprofile: Number(e.target.value) })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Nombre entrée</label>
                    <input type="number" className="form-control" value={commandeForm.nombreentree} onChange={(e) => setCommandeForm({ ...commandeForm, nombreentree: Number(e.target.value) })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Date début</label>
                    <input type="datetime-local" className="form-control" value={commandeForm.datedebut} onChange={(e) => setCommandeForm({ ...commandeForm, datedebut: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date expiration</label>
                    <input type="datetime-local" className="form-control" value={commandeForm.dateexp} onChange={(e) => setCommandeForm({ ...commandeForm, dateexp: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Compteurs</label>
                    <input className="form-control" value={commandeIds.join(', ')} readOnly />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => !commandeSubmitting && setShowCommandeModal(false)} disabled={commandeSubmitting}>Annuler</button>
                <button className="btn btn-primary" onClick={handleCommandeSave} disabled={commandeSubmitting}>
                  {commandeSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssociateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white">Associer à un équipement</h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => !associateSubmitting && setShowAssociateModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <p className="mb-2">Associer le compteur : <strong>{associatingCompteur?.numeroCompteur}</strong></p>
                  <label className="form-label" htmlFor="equipement-select">Sélectionner un équipement</label>
                  <select
                    id="equipement-select"
                    className="form-select"
                    value={selectedEquipementId}
                    onChange={(e) => setSelectedEquipementId(Number(e.target.value))}
                    disabled={associateSubmitting}
                  >
                    <option value={0}>Choisir un équipement...</option>
                    {equipements.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.libelle} ({eq.numeroSerie})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-alt-secondary"
                  onClick={() => setShowAssociateModal(false)}
                  disabled={associateSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAssociateSave}
                  disabled={associateSubmitting || !selectedEquipementId}
                >
                  {associateSubmitting ? (
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
      )}

      <AssociateCelluleToCompteurModal
        show={showCelluleModal}
        onClose={() => { setShowCelluleModal(false); setAssociatingCelluleCompteur(null) }}
        onSave={handleCelluleAssocSave}
        compteur={associatingCelluleCompteur}
        cellules={cellules}
        submitting={celluleAssocSubmitting}
      />
    </MainLayout>
  )
}

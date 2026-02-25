import MainLayout from '../layouts/MainLayout'
import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import DataTable, { type Column } from '../components/common/DataTable'
import CommandeModal, { type CommandeFormValues } from '../components/commandes/CommandeModal'
import { commandeApi, type Commande } from '../api/commandeApi'
import { commandeService } from '../services/commandeService'
import { typeCommandeService } from '../services/typeCommandeService'
import { authService } from '../services/authService'
import { compteurApi } from '../api/compteurApi'
import { usePermissions } from '../context/PermissionContext'

export default function CommandesList() {
  const { hasPermission } = usePermissions()
  const [numeroCompteur, setNumeroCompteur] = useState('')
  const [rows, setRows] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Commande | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const [types, setTypes] = useState<Array<{ id: number; libelletype: string }>>([])
  const [compteurs, setCompteurs] = useState<Array<{ id: number; numeroCompteur?: string; idCompteur?: string }>>([])

  const loadList = async (compteursList?: Array<{ id: number; numeroCompteur?: string }>) => {
    setLoading(true)
    try {
      const res = await commandeService.list()
      const data = (res?.data as any) || []
      const items = Array.isArray(data) ? data : (data?.data ?? [])

      const nc = new URL(window.location.href).searchParams.get('numeroCompteur') || ''
      const cptrs = compteursList ?? compteurs

      if (nc && cptrs.length > 0) {
        const matched = cptrs.find(c => c.numeroCompteur === nc)
        if (matched) {
          const cId = matched.id
          const details = await Promise.all(
            items.map((item: any) => commandeApi.getById(item.id).catch(() => null))
          )
          const filtered = items.filter((_: any, i: number) => {
            const d = details[i]
            const cmd = d?.isSuccess !== undefined ? d.data : d
            const cc = cmd?.commandeCompteur
            return Array.isArray(cc) && cc.some((x: any) => x.compteurId === cId)
          })
          setRows(filtered)
          return
        }
      }

      setRows(items)
    } catch (_) {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const loadCompteurs = async () => {
    try {
      const res = await compteurApi.list()
      const items = (res?.data as any) ?? []
      const arr = Array.isArray(items) ? items : (items?.data ?? [])
      const mapped = arr.map((c: any) => ({ id: c.id, numeroCompteur: c.numeroCompteur, idCompteur: c.idCompteur }))
      setCompteurs(mapped)
    } catch (_) {
      setCompteurs([])
    }
  }

  const loadTypes = async () => {
    try {
      const res = await typeCommandeService.list()
      const data = (res?.data as any) || []
      const items = Array.isArray(data) ? data : (data?.data ?? [])
      const mapped = items.map((t: any) => ({ id: t.id, libelletype: t.libelletype ?? String(t.id) }))
      setTypes(mapped)
    } catch (_) {
      setTypes([])
    }
  }

  useEffect(() => {
    try {
      const u = new URL(window.location.href)
      setNumeroCompteur(u.searchParams.get('numeroCompteur') || '')
    } catch { }
  }, [])

  useEffect(() => {
    ; (async () => {
      const [, , compteursRes] = await Promise.all([loadTypes(), loadCompteurs(), compteurApi.list().catch(() => ({ data: [] }))])
      const cData = (compteursRes?.data as any) ?? []
      const cArr = Array.isArray(cData) ? cData : (cData?.data ?? [])
      const mappedCptrs = cArr.map((c: any) => ({ id: c.id, numeroCompteur: c.numeroCompteur }))
      await loadList(mappedCptrs)
      try {
        const me = await authService.getCurrent()
        const u = (me?.data as any)?.data ?? me?.data
        const id = u?.id ?? u?.userId ?? ''
        setUserId(String(id))
      } catch (_) { }
    })()
  }, [])

  const onNew = () => { setEditing(null); setShowModal(true) }
  const onEdit = (c: Commande) => { setEditing(c); setShowModal(true) }
  const onDelete = async (c: Commande) => {
    const ask = (window as any).Swal
    const confirm = ask
      ? await ask.fire({ icon: 'warning', title: 'Supprimer cette commande ?', text: c.libellecommande, showCancelButton: true, confirmButtonText: 'Oui, supprimer' })
      : { isConfirmed: window.confirm(`Supprimer la commande « ${c.libellecommande} » ?`) }
    if (!confirm.isConfirmed) return
    try {
      setSubmitting(true)
      await commandeApi.remove({ Id: c.id, DeletedBy: String(userId) })
      await loadList()
      ask && ask.fire({ icon: 'success', title: 'Supprimé', timer: 1200, showConfirmButton: false })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la suppression'
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (values: CommandeFormValues) => {
    try {
      setSubmitting(true)
      if (editing?.id) {
        await commandeApi.edit({
          Id: editing.id,
          Libellecommande: values.libellecommande,
          Dateexec: values.dateexec,
          Datefin: values.datefin,
          Numeroprofile: values.numeroprofile,
          Nombreentree: values.nombreentree,
          Decalage: values.decalage,
          Datedebut: values.datedebut,
          Dateexp: values.dateexp,
          TypecommandeId: values.typecommandeId,
          CompteurId: values.compteurId,
          UpdatedBy: String(userId),
        })
      } else {
        const res = await commandeApi.add({
          Libellecommande: values.libellecommande,
          Dateexec: values.dateexec,
          Datefin: values.datefin,
          Numeroprofile: values.numeroprofile,
          Nombreentree: values.nombreentree,
          Decalage: values.decalage,
          Datedebut: values.datedebut,
          Dateexp: values.dateexp,
          TypecommandeId: values.typecommandeId,
          CompteurId: values.compteurId,
          CreatedBy: String(userId),
        })
        if (res.isSuccess && res.data?.id) {
          try {
            await commandeApi.execute(res.data.id)
          } catch (execErr) {
            console.error('Erreur lors de l\'exécution automatique de la commande:', execErr)
          }
        }
      }
      setShowModal(false)
      setEditing(null)
      await loadList()
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

  const columns = useMemo<Column<any>[]>(() => [
    { key: 'id', title: 'ID', width: 70, align: 'center' },
    {
      key: 'libellecommande',
      title: 'Libellé',
      render: (r: any) => <span className="fw-semibold fs-sm">{r.libellecommande ?? '—'}</span>
    },
    { key: 'statut', title: 'Statut' },
    {
      key: 'dateexec',
      title: 'Date exécution',
      render: (r: any) => (r.dateexec ? String(r.dateexec).replace('T', ' ').substring(0, 16) : '—')
    },
    {
      key: 'datefin',
      title: 'Date fin',
      render: (r: any) => (r.datefin ? String(r.datefin).replace('T', ' ').substring(0, 16) : '—')
    },
    {
      key: 'typecommande',
      title: 'Type',
      render: (r: any) => r?.typecommande?.libelletype ?? r?.typecommandeId ?? '—'
    },
  ],
    [navigate, onDelete],
  )

  return (
    <MainLayout>
      <div className="content content-full">
        {numeroCompteur && (
          <ul className="nav nav-tabs nav-tabs-block mb-4" role="tablist">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={`/lecture/statistiques?numeroCompteur=${encodeURIComponent(numeroCompteur)}`}>Statistiques</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={`/lecture/derniere-quotidienne?numeroCompteur=${encodeURIComponent(numeroCompteur)}`}>Dernière lecture quotidienne</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={`/lecture/evenements?numeroCompteur=${encodeURIComponent(numeroCompteur)}`}>Événements</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={`/lecture/commandes?numeroCompteur=${encodeURIComponent(numeroCompteur)}`}>Commandes</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={`/lecture/concentrateurs?numeroCompteur=${encodeURIComponent(numeroCompteur)}`}>Concentrateurs de données</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={`/lecture/lectures?numeroCompteur=${encodeURIComponent(numeroCompteur)}`}>Lectures</NavLink>
            </li>
          </ul>
        )}
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">Liste commandes{numeroCompteur ? ` — Compteur ${numeroCompteur}` : ''}</h3>
            <div className="block-options">
              {hasPermission('Créer une commande') && (
                <button className="btn btn-sm btn-success" onClick={onNew}>
                  <i className="fa-solid fa-plus me-1"></i> Nouveau
                </button>
              )}
            </div>
          </div>
          <div className="block-content block-content-full">
            <DataTable
              title="Commandes"
              columns={columns}
              rows={rows}
              loading={loading}
              actions={(r: any) => (
                <>
                  <button
                    className="btn btn-sm btn-alt-info"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/commandes/${r.id}`)
                    }}
                    title="Voir le détail"
                  >
                    <i className="fa fa-eye"></i>
                  </button>
                  {hasPermission('Modifier une commande') && (
                    <button
                      className="btn btn-sm btn-alt-secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(r)
                      }}
                      title="Modifier"
                    >
                      <i className="fa fa-pen"></i>
                    </button>
                  )}
                  {hasPermission('Supprimer une commande') && (
                    <button
                      className="btn btn-sm btn-alt-danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(r)
                      }}
                      disabled={submitting}
                      title="Supprimer"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  )}
                </>
              )}
            />
          </div>
        </div>
      </div>
      <CommandeModal
        show={showModal}
        onClose={() => { if (!submitting) { setShowModal(false); setEditing(null) } }}
        onSubmit={handleSubmit}
        initial={editing ?? undefined}
        submitting={submitting}
        types={types}
        compteurs={compteurs}
      />
    </MainLayout>
  )
}

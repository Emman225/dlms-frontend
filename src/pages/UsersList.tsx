import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import DataTable, { type Column } from '../components/common/DataTable'
import { userService } from '../services/userService'
import { userApi, type User } from '../api/userApi'
import UserModal, { type UserFormValues } from '../components/users/UserModal'
import { roleService } from '../services/roleService'
import { authService } from '../services/authService'
import { usePermissions } from '../context/PermissionContext'
import { posteService } from '../services/posteService'

export default function UsersList() {
  const { hasPermission } = usePermissions()
  const [rows, setRows] = useState<Array<User>>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [roles, setRoles] = useState<Array<{ id: string; libelle: string }>>([])
  const [postes, setPostes] = useState<Array<{ id: number; libelle: string }>>([])
  const [userId, setUserId] = useState<string>('')

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await userService.list()
      const body = res?.data as any

      let items = []
      if (Array.isArray(body)) {
        items = body
      } else if (body && Array.isArray(body.data)) {
        items = body.data
      } else if (body && body.data && Array.isArray(body.data.data)) {
        items = body.data.data
      } else if (body && body.data && Array.isArray(body.data.items)) {
        items = body.data.items
      } else if (body && Array.isArray(body.users)) {
        items = body.users
      } else if (body && body.data && Array.isArray(body.data.users)) {
        items = body.data.users
      } else if (body && Array.isArray(body.response)) {
        items = body.response
      }

      setRows(items)
    } catch (err) {
      console.error('UsersList: Error loading list', err)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const res = await roleService.list()
      const body = res?.data as any

      let items = []
      if (Array.isArray(body)) {
        items = body
      } else if (body && Array.isArray(body.data)) {
        items = body.data
      } else if (body && body.data && Array.isArray(body.data.data)) {
        items = body.data.data
      } else if (body && body.data && Array.isArray(body.data.items)) {
        items = body.data.items
      } else if (body && Array.isArray(body.roles)) {
        items = body.roles
      }

      const mapped = items.map((r: any) => ({
        id: r.id,
        libelle: r.libelle ?? r.name ?? String(r.id)
      }))
      setRoles(mapped)
    } catch (err) {
      console.error('UsersList: Error loading roles', err)
      setRoles([])
    }
  }


  const loadPostes = async () => {
    try {
      const res = await posteService.list()
      const body = res?.data as any
      let items = []
      if (Array.isArray(body)) items = body
      else if (body?.data && Array.isArray(body.data)) items = body.data
      else if (body?.data?.postes && Array.isArray(body.data.postes)) items = body.data.postes

      const mapped = items.map((p: any) => ({
        id: p.id,
        libelle: p.libelle ?? p.nom ?? p.numero
      }))
      setPostes(mapped)
    } catch (err) {
      console.error('UsersList: Error loading postes', err)
      setPostes([])
    }
  }

  useEffect(() => {
    // Parallelize loads
    loadList();
    loadRoles();
    loadPostes();

    (async () => {
      try {
        const me = await authService.getCurrent()
        const u = (me?.data as any)?.data ?? me?.data
        const id = u?.id ?? u?.userId ?? ''
        setUserId(String(id))
      } catch (_) { }
    })()
  }, [])

  const onNew = () => { setEditing(null); setShowModal(true) }
  const onEdit = (u: User) => { setEditing(u); setShowModal(true) }
  const onUnlock = async (u: User) => {
    const ask = (window as any).Swal
    const confirm = ask
      ? await ask.fire({
        icon: 'warning',
        title: 'Déverrouiller cet utilisateur ?',
        text: u.nomPrenoms ?? `${u.nom} ${u.prenoms}`,
        showCancelButton: true,
        confirmButtonText: 'Oui, déverrouiller'
      })
      : { isConfirmed: window.confirm(`Déverrouiller l'utilisateur « ${u.nomPrenoms ?? `${u.nom} ${u.prenoms}`} » ?`) }

    if (!confirm.isConfirmed) return

    try {
      setSubmitting(true)
      await userApi.unlock(u.id)

      // OPTIMIZATION: Update local state
      setRows(prev => prev.map(row => row.id === u.id ? { ...row, isLocked: false } : row))

      ask && ask.fire({ icon: 'success', title: 'Compte déverrouillé', timer: 1200, showConfirmButton: false })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors du déverrouillage'
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (u: User) => {
    const ask = (window as any).Swal
    const confirm = ask
      ? await ask.fire({ icon: 'warning', title: 'Supprimer cet utilisateur ?', text: u.nomPrenoms ?? `${u.nom} ${u.prenoms}`, showCancelButton: true, confirmButtonText: 'Oui, supprimer' })
      : { isConfirmed: window.confirm(`Supprimer l'utilisateur « ${u.nomPrenoms ?? `${u.nom} ${u.prenoms}`} » ?`) }
    if (!confirm.isConfirmed) return
    try {
      setSubmitting(true)
      await userApi.remove({ id: u.id, deletedBy: String(userId) } as any)

      // OPTIMIZATION: Update local state
      setRows(prev => prev.filter(row => row.id !== u.id))

      ask && ask.fire({ icon: 'success', title: 'Supprimé', timer: 1200, showConfirmButton: false })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la suppression'
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (values: UserFormValues) => {
    try {
      setSubmitting(true)
      let successMessage = 'Enregistré avec succès';
      if (editing?.id) {
        const payload = {
          id: editing.id,
          ...values,
          posteId: values.posteId === '' ? null : values.posteId,
          updatedBy: String(userId)
        };
        const res = await userApi.edit(payload as any)
        if (res?.message) successMessage = res.message;

        // OPTIMIZATION: Update local state
        setRows(prev => prev.map(row => row.id === editing.id ? { ...row, ...payload } as User : row))
      } else {
        const res = await userApi.add({
          ...values,
          posteId: values.posteId === '' ? null : values.posteId,
          createdBy: String(userId)
        } as any)
        if (res?.message) successMessage = res.message;

        // OPTIMIZATION: Add to local state
        if (res && res.data) {
          setRows(prev => [res.data, ...prev])
        } else {
          await loadList()
        }
      }
      setShowModal(false)
      setEditing(null)
      const ask = (window as any).Swal
      if (ask) {
        ask.fire({
          icon: 'success',
          title: 'Succès',
          text: successMessage,
          confirmButtonText: 'OK'
        })
      } else {
        alert(successMessage)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Erreur lors de l'enregistrement"
      const ask = (window as any).Swal
      ask ? ask.fire({ icon: 'error', title: 'Erreur', text: msg }) : alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo<Column<User>[]>(() => [
    { key: 'nomPrenoms', title: 'Nom & Prénoms', render: (u) => <span className="fw-semibold fs-sm">{u.nomPrenoms ?? `${u.nom ?? ''} ${u.prenoms ?? ''}`}</span> },
    { key: 'email', title: 'Email' },
    { key: 'mobile', title: 'Téléphone' },
    { key: 'role', title: 'Rôle', render: (u) => u?.role?.libelle ?? u?.roleId ?? '—' },
    { key: 'poste', title: 'Poste', render: (u) => u?.poste?.libelle ?? (u?.posteId ? 'Poste définie' : '—') },
    {
      key: 'isLocked',
      title: 'État',
      render: (u: User) => {
        // Stricter check: only show locked if we have a clear indicator
        const val = u.isLocked ?? (u as any).IsLocked ?? (u as any).lockoutEnabled;
        const lockoutEnd = (u as any).lockoutEnd || (u as any).LockoutEnd;
        const isLockedByEnd = lockoutEnd ? new Date(lockoutEnd) > new Date() : false;

        // Final combined lock status
        const isLocked = val === true || val === 'true' || isLockedByEnd;

        return (
          <span className={`badge ${isLocked ? 'bg-danger' : 'bg-success'}`}>
            {isLocked ? 'Bloqué' : 'Actif'}
          </span>
        )
      }
    },
  ], [])

  return (
    <MainLayout>
      <div className="content content-full">
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">Liste utilisateurs</h3>
            <div className="block-options">
              {hasPermission('Créer un utilisateur') && (
                <button className="btn btn-sm btn-success" onClick={onNew}>
                  <i className="fa-solid fa-plus me-1"></i> Nouveau
                </button>
              )}
            </div>
          </div>
          <div className="block-content block-content-full">
            <DataTable
              title="Utilisateurs"
              columns={columns}
              rows={rows}
              loading={loading}
              actions={(u: User) => (
                <>
                  {hasPermission('Modifier un utilisateur') && (
                    <button className="btn btn-sm btn-alt-secondary" onClick={() => onEdit(u)} title="Editer">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  )}
                  {hasPermission('Supprimer un utilisateur') && (
                    <button className="btn btn-sm btn-alt-danger" onClick={() => onDelete(u)} disabled={submitting} title="Supprimer">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                  {(() => {
                    const val = u.isLocked ?? (u as any).IsLocked ?? (u as any).lockoutEnabled;
                    const lockoutEnd = (u as any).lockoutEnd || (u as any).LockoutEnd;
                    const isLockedByEnd = lockoutEnd ? new Date(lockoutEnd) > new Date() : false;

                    const isLocked = val === true || val === 'true' || isLockedByEnd;

                    // ONLY show if locked
                    return isLocked && hasPermission('Modifier un utilisateur') && (
                      <button className="btn btn-sm btn-alt-success" onClick={() => onUnlock(u)} disabled={submitting} title="Déverrouiller le compte">
                        <i className="fa-solid fa-lock-open"></i>
                      </button>
                    )
                  })()}
                </>
              )}
            />
          </div>
        </div>
      </div>
      <UserModal
        show={showModal}
        onClose={() => { if (!submitting) { setShowModal(false); setEditing(null) } }}
        onSubmit={handleSubmit}
        initial={editing ?? undefined}
        submitting={submitting}
        roles={roles}
        postes={postes}
      />
    </MainLayout>
  )
}

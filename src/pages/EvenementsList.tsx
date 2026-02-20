import MainLayout from '../layouts/MainLayout'
import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { gxdlmsApi } from '../api/gxdlmsApi'
import DataTable, { type Column } from '../components/common/DataTable'

export default function EvenementsList() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [numeroCompteur, setNumeroCompteur] = useState('')

  useEffect(() => {
    try {
      const u = new URL(window.location.href)
      setNumeroCompteur(u.searchParams.get('numeroCompteur') || '')
    } catch { }
  }, [])

  useEffect(() => {
    if (!numeroCompteur) return
      ; (async () => {
        setLoading(true)
        try {
          const res = await gxdlmsApi.profilEventsByStatus({ numeroCompteur: numeroCompteur })
          const items = Array.isArray(res?.data) ? res.data : []
          const mapped = items.map((it: any) => ({
            date: formatDateTime(it.dateEnr ?? it.date ?? it.createdAt),
            origine: 'Compteur',
            nom: (it.event?.code2 ?? it.codeobis?.code2 ?? it.event?.code1 ?? '—'),
            category: (it.event?.category ?? it.codeobis?.category ?? '—'),
          }))
          setRows(mapped)
        } catch (_) {
          setRows([])
        } finally {
          setLoading(false)
        }
      })()
  }, [numeroCompteur])

  function formatDateTime(input?: string) {
    if (!input) return '—'
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return String(input)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
  }

  const columns = useMemo<Column<any>[]>(() => [
    { key: 'date', title: 'Date' },
    { key: 'origine', title: 'Origine' },
    { key: 'nom', title: 'Nom', render: (r) => <span className="fw-semibold">{r.nom}</span> },
    { key: 'category', title: 'Catégorie' },
  ], [])

  return (
    <MainLayout>
      <div className="content content-full">
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
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">
              {numeroCompteur ? `Liste événements du compteur ${numeroCompteur}` : 'Liste événements'}
            </h3>
          </div>
          <div className="block-content block-content-full p-0">
            <DataTable
              title="Événements"
              columns={columns}
              rows={rows}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}


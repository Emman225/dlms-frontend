import MainLayout from '../layouts/MainLayout'
import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { gxdlmsApi, type ProfilDetailItem } from '../api/gxdlmsApi'
import DataTable, { type Column } from '../components/common/DataTable'

type EventRow = {
  id: number
  index: string | null
  date: string
  nom: string
  code: string
  valeur: number
  categorie: string
}

export default function EvenementsList() {
  const [rows, setRows] = useState<EventRow[]>([])
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
    ;(async () => {
      setLoading(true)
      try {
        const res = await gxdlmsApi.profilEventsByStatus({ numeroCompteur })
        const items = Array.isArray(res?.data) ? res.data : []
        setRows(processEventItems(items))
      } catch (_) {
        setRows([])
      } finally {
        setLoading(false)
      }
    })()
  }, [numeroCompteur])

  /**
   * Group raw API items by dateEnr and extract only EVENT_CODE items.
   * Each dateEnr group contains:
   *  - 1 PARAMETER_CLOCK item (Unix timestamp)
   *  - N EVENT_CODE items (actual events with event object)
   *  - N LONG_INDEX items (sequence counters, paired with EVENT_CODE items)
   */
  function processEventItems(items: ProfilDetailItem[]): EventRow[] {
    const groups = new Map<string, ProfilDetailItem[]>()
    for (const item of items) {
      const key = item.dateEnr
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }

    const events: EventRow[] = []
    for (const [, groupItems] of groups) {
      // Find Unix clock for more precise date
      const clockItem = groupItems.find(it => it.codeobis?.category === 'PARAMETER_CLOCK')
      const unixTs = clockItem ? Number(clockItem.value) : null

      // Only keep items that have an actual event (EVENT_CODE items)
      const eventItems = groupItems.filter(it => it.event != null)

      // LONG_INDEX items for sequence numbers
      const indexItems = groupItems.filter(it => it.codeobis?.category === 'LONG_INDEX')

      for (let i = 0; i < eventItems.length; i++) {
        const ev = eventItems[i]
        if (!ev.event) continue

        const eventDate = unixTs
          ? new Date(unixTs * 1000)
          : new Date(ev.dateEnr)

        events.push({
          id: ev.id,
          index: indexItems[i]?.value ?? null,
          date: formatDateTime(eventDate),
          nom: formatLabel(ev.event.code2 || ev.event.code1),
          code: ev.event.code1,
          valeur: ev.event.value,
          categorie: formatLabel(ev.event.category),
        })
      }
    }

    return events
  }

  function formatDateTime(input: Date | string | undefined): string {
    if (!input) return '—'
    const d = input instanceof Date ? input : new Date(input)
    if (Number.isNaN(d.getTime())) return String(input)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
  }

  function formatLabel(str: string): string {
    if (!str) return '—'
    return str
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  const columns = useMemo<Column<EventRow>[]>(() => [
    { key: 'index', title: 'N°', width: 70, align: 'center' },
    { key: 'date', title: 'Date' },
    {
      key: 'nom', title: 'Événement', render: (r) => (
        <span className="fw-semibold">{r.nom}</span>
      )
    },
    { key: 'code', title: 'Code' },
    { key: 'valeur', title: 'Valeur', width: 80, align: 'center' },
    { key: 'categorie', title: 'Catégorie' },
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

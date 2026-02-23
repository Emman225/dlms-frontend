import MainLayout from '../layouts/MainLayout'
import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { gxdlmsApi } from '../api/gxdlmsApi'
import { codeObisApi } from '../api/codeObisApi'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { compteurService } from '../services/compteurService'


export default function LectureDonneesCompteurList() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [typeProfil, setTypeProfil] = useState<string>('1')
  const [dateFin, setDateFin] = useState<string>(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [numeroCompteur, setNumeroCompteur] = useState<string>('')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  const [compteurInfo, setCompteurInfo] = useState<any>(null)

  const [allCompteurs, setAllCompteurs] = useState<any[]>([])
  const [selectedCompteurs, setSelectedCompteurs] = useState<string[]>([])
  const [obisList, setObisList] = useState<any[]>([])
  const [selectedObisIds, setSelectedObisIds] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(true)

  const [meterSearch, setMeterSearch] = useState('')
  const [obisSearch, setObisSearch] = useState('')

  const location = useLocation()
  const isCommandes = (location?.pathname || '').includes('/lecture/commandes')

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const n = searchParams.get('numeroCompteur');

    if (n) {
      // Mode Mono-compteur
      setNumeroCompteur(n);
      setSelectedCompteurs([n]);
      // Si les listes sont déjà chargées, on peut lancer la recherche direct
      if (allCompteurs.length > 0) {
        fetchData(n);
      }
    } else {
      // Mode Lecture Groupée
      setNumeroCompteur('');
      setSelectedCompteurs([]);
      setCompteurInfo(null);
      setRows([]);
      setHasSearched(false);
    }

    // Chargement initial des listes si nécessaire
    if (allCompteurs.length === 0) {
      loadInitialData(n);
    }
  }, [location.search]);

  const loadInitialData = async (numFromUrl?: string | null) => {
    try {
      const [resCompteurs, resObis] = await Promise.all([
        compteurService.list(),
        codeObisApi.list()
      ])

      const cData = resCompteurs.data?.data || resCompteurs.data || []
      const meters = Array.isArray(cData) ? cData : []
      setAllCompteurs(meters)

      if (numFromUrl) {
        const found = meters.find((c: any) => String(c.numeroCompteur) === String(numFromUrl))
        if (found) setCompteurInfo(found)
      }

      const oData = resObis.data || []
      const finalObis = Array.isArray(oData) ? oData : []
      setObisList(finalObis)

      // Si on arrive avec un numéro de compteur (clic sur numéro de série), on lance la recherche immédiatement
      if (numFromUrl) {
        // On passe forcedObisList pour éviter d'attendre le cycle de mise à jour du state
        fetchData(numFromUrl, finalObis)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des initiales:', err)
    }
  }

  const fetchData = async (forcedNum?: string, forcedObisList?: any[]) => {
    const meters = forcedNum ? [forcedNum] : selectedCompteurs
    if (meters.length === 0 && !forcedNum) {
      const ask = (window as any).Swal
      if (ask) ask.fire({ icon: 'warning', title: 'Attention', text: 'Veuillez sélectionner au moins un compteur.' })
      return
    }

    setLoading(true)
    setHasSearched(true)
    try {
      const profileMapping: Record<string, number> = {
        '1': 1, // energetique
        '2': 2, // technique
        '3': 3, // quotidien
        '4': 4, // mensuel
      }
      const profilId = profileMapping[typeProfil] || 1

      // Récupérer le ID utilisateur depuis le localStorage
      const userProfileRaw = localStorage.getItem('user_profile')
      let userId = ''
      if (userProfileRaw) {
        try {
          const profile = JSON.parse(userProfileRaw)
          userId = profile.id || profile.UtilisateurId || ''
        } catch { }
      }

      let result;
      if (meters.length === 1) {
        // OBLIGATOIRE: Utiliser l'endpoint profilgenericdetailByStatus pour un seul compteur
        const dateEnrFormatted = dateFin ? `${dateFin}T00:00:00` : undefined

        console.log('LectureDonneesCompteurList: Appel profilDetailByStatus mono-compteur', {
          NumeroCompteur: meters[0],
          GxdlmsprofilgenericId: profilId,
          DateEnr: dateEnrFormatted
        });

        result = await gxdlmsApi.profilDetailByStatus({
          NumeroCompteur: meters[0],
          GxdlmsprofilgenericId: profilId,
          DateEnr: dateEnrFormatted,
          UserId: userId || undefined
        })
      } else {
        // Utilisation de l'endpoint POST par critères multiples pour plusieurs compteurs
        const listToUse = forcedObisList || obisList;
        const finalObisIds = selectedObisIds.length > 0
          ? selectedObisIds
          : listToUse.slice(0, 50).map((o: any) => o.id).filter((id: any) => id != null);

        const queryParams: any = {
          numeroCompteurs: meters,
          gxdlmsprofilgenericIds: [profilId],
          codeobisIds: finalObisIds
        }

        if (dateFin) queryParams.dateEnr = dateFin
        if (userId && userId.trim() !== '') queryParams.userId = userId

        console.log('LectureDonneesCompteurList: Requesting multiple criteria with params:', queryParams)
        result = await gxdlmsApi.profilDetailByMultipleCriteria(queryParams)
      }

      // Extraction des données (result est de type ApiResult)
      let arr: any[] = result?.data || []

      // Filtrage par OBIS côté client si on est sur l'endpoint mono-compteur (qui renvoie tout le profil)
      if (meters.length === 1 && selectedObisIds.length > 0) {
        arr = arr.filter((it: any) => selectedObisIds.includes(it.codeObisId))
      }

      if (arr.length > 500) {
        arr = arr.slice(0, 500)
      }

      // Trier par date décroissante
      arr.sort((a, b) => {
        const da = new Date(a.dateEnr || 0).getTime()
        const db = new Date(b.dateEnr || 0).getTime()
        return db - da
      })

      // Mapping final pour affichage dans la table
      const mapped = arr.map((it: any) => {
        const raw = it?.dateEnr ?? it?.createdAt ?? ''
        let formattedDate = '—'
        if (raw) {
          try {
            const d = new Date(raw)
            if (!isNaN(d.getTime())) {
              formattedDate = d.toISOString().replace('T', ' ').split('.')[0]
            } else formattedDate = String(raw)
          } catch { formattedDate = String(raw) }
        }

        const val = it?.codeobis?.value || it?.codeObis || it?.obis || '';
        let label = it?.codeobis?.code2 || '';
        let finalCodeObis = label ? `${val} - ${label}` : (val || '—');

        // Ajustement pour les noms de statuts
        if (val === '0.0.96.10.1.255' || (label && label.toUpperCase().includes('STATUT'))) {
          const mappingLabels: Record<string, string> = { '1': '1', '2': '2', '3': '3', '4': '4' }
          finalCodeObis = `${val || '0.0.96.10.1.255'} - STATUT_${mappingLabels[typeProfil] || typeProfil}`;
        }

        return {
          date: formattedDate,
          origine: it?.gxdlmsprofilgeneric?.codeobis?.code2 ?? it?.origine ?? it?.source ?? 'Compteur',
          numeroCompteur: it?.numeroCompteur ?? '—',
          codeObis: finalCodeObis,
          valeur: it?.value ?? it?.valeur ?? '—',
          unite: it?.codeobis?.unit ?? it?.unite ?? it?.unit ?? '—',
        }
      })

      setRows(mapped)
    } catch (err: any) {
      console.error('LectureDonneesCompteurList: Erreur fetchData:', err)
      setRows([])
      const ask = (window as any).Swal
      if (ask) ask.fire({ icon: 'error', title: 'Erreur', text: err?.message || 'Erreur de chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Réinitialiser la pagination à la première page quand les données changent
    setCurrentPage(1)
  }, [rows])

  useEffect(() => {
    // Auto-refresh when filters change if we have already searched once
    // Utilisation d'un debounce manuel simple pour éviter trop d'appels
    if (hasSearched && (selectedCompteurs.length > 0 || numeroCompteur)) {
      const timer = setTimeout(() => fetchData(), 500)
      return () => clearTimeout(timer)
    }
  }, [typeProfil, dateFin])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const pagedRows = rows.slice(startIndex, startIndex + pageSize)

  const filteredCompteurs = useMemo(() => {
    if (!meterSearch) return allCompteurs
    const search = meterSearch.toLowerCase()
    return allCompteurs.filter(c =>
      String(c.numeroCompteur).toLowerCase().includes(search) ||
      (c.celluleLibelle && String(c.celluleLibelle).toLowerCase().includes(search))
    )
  }, [allCompteurs, meterSearch])

  const filteredObis = useMemo(() => {
    if (!obisSearch) return obisList
    const search = obisSearch.toLowerCase()
    return obisList.filter(o =>
      String(o.value).toLowerCase().includes(search) ||
      String(o.code2).toLowerCase().includes(search)
    )
  }, [obisList, obisSearch])

  // Groupement rendu côté React pour éviter toute duplication et correspondre exactement au visuel
  const groupedRows = useMemo(() => {
    const groups: Array<{ date: string; items: any[] }> = []
    let currentDate: string | null = null
    let currentItems: any[] = []
    for (const r of pagedRows) {
      const d = r.date ?? r.dateLecture ?? r.createdAt ?? ''
      if (currentDate === null || d !== currentDate) {
        if (currentItems.length) groups.push({ date: currentDate as string, items: currentItems })
        currentDate = d
        currentItems = [r]
      } else {
        currentItems.push(r)
      }
    }
    if (currentItems.length) groups.push({ date: currentDate as string, items: currentItems })
    return groups
  }, [pagedRows])

  useEffect(() => {
    const w = window as any
    const $ = w.jQuery || w.$
    if (!$ || !$.fn || !$.fn.DataTable) return
    const sel = '.js-dataTable-lectures'
    const tableElement = $(sel)
    if (!tableElement.length) return

    // On ne re-initialise DataTable que si le contenu a radicalement changé (vidage/rechargement)
    // Sinon on laisse React gérer le DOM pour éviter le freeze du re-init constant sur chaque page
    if ($.fn.dataTable.isDataTable(tableElement)) {
      // Si on est en train de naviguer dans les pages React, on ne détruit pas forcément le DT
      // sauf si on a rechargé de nouvelles données
      if (loading) return;
    }

    tableElement.DataTable({
      dom: '<"row mb-3"<"col-sm-12 col-md-6"f>>' +
        '<"row"<"col-sm-12"tr>>' +
        '<"row mt-3"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
      paging: false,
      destroy: true, // Permet de ré-initialiser proprement
      order: [[0, 'desc']],
      columnDefs: [{ targets: [0, 1], orderable: false }],
      language: {
        sEmptyTable: 'Aucune donnée disponible',
        sSearch: 'Rechercher:',
        sInfo: 'Affichage de _START_ à _END_ sur _TOTAL_ entrées',
      },
    })
  }, [groupedRows, loading])

  const exportToExcel = () => {
    if (rows.length === 0) return
    const dataToExport = rows.map(r => ({
      'Date': r.date,
      'Code OBIS': r.codeObis,
      'Valeur': r.valeur,
      'Unité': r.unite
    }))
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Lectures")

    const profilLabel = {
      '1': 'Energetique',
      '2': 'Technique',
      '3': 'Quotidien',
      '4': 'Mensuel',
    }[typeProfil] || 'Lectures'

    const fileName = `Lectures_${profilLabel}_${numeroCompteur || 'Compteur'}_${dateFin || 'Toutes'}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const exportToCSV = () => {
    if (rows.length === 0) return
    const dataToExport = rows.map(r => ({
      'Date': r.date,
      'Code OBIS': r.codeObis,
      'Valeur': r.valeur,
      'Unité': r.unite
    }))
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    const profilLabel = {
      '1': 'Energetique',
      '2': 'Technique',
      '3': 'Quotidien',
      '4': 'Mensuel',
    }[typeProfil] || 'Lectures'

    link.setAttribute("href", url)
    link.setAttribute("download", `Lectures_${profilLabel}_${numeroCompteur || 'Compteur'}_${dateFin || 'Toutes'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    if (rows.length === 0) return
    const doc = new jsPDF()
    const tableColumn = ["Date", "Code OBIS", "Valeur", "Unité"]
    const tableRows = rows.map(r => [
      r.date,
      r.codeObis,
      r.valeur,
      r.unite
    ])

    const profilLabel = {
      '1': 'Profil énergétique',
      '2': 'Profil technique',
      '3': 'Profil quotidien',
      '4': 'Profil mensuel',
    }[typeProfil] || 'Lectures'

    doc.setFontSize(16)
    const cellPrefix = compteurInfo?.celluleLibelle ? `${compteurInfo.celluleLibelle} - ` : ''
    doc.text(`${profilLabel} - ${cellPrefix}Compteur: ${numeroCompteur || 'N/A'}`, 14, 15)
    doc.setFontSize(10)
    doc.text(`Date des données: ${dateFin || 'Toutes'}`, 14, 22)
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 28)

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    })

    const fileName = `Lectures_${typeProfil}_${numeroCompteur || 'Compteur'}_${dateFin || 'Toutes'}.pdf`
    doc.save(fileName)
  }


  return (
    <MainLayout>
      <div className="content content-full">
        {/* Onglets de navigation (cliquables) */}
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

        {isCommandes ? (
          <div className="block block-rounded">
            <div className="block-header block-header-default">
              <h3 className="block-title">Liste commandes</h3>
            </div>
          </div>
        ) : (
          <>
            {/* Filtres Avancés */}
            <div className={`block block-rounded ${showFilters ? '' : 'block-mode-hidden'}`}>
              <div className="block-header block-header-default">
                <h3 className="block-title">Critères de recherche</h3>
                <div className="block-options">
                  <button type="button" className="btn-block-option" onClick={() => setShowFilters(!showFilters)}>
                    <i className={showFilters ? 'fa fa-angle-up' : 'fa fa-angle-down'}></i>
                  </button>
                </div>
              </div>
              <div className="block-content">
                <div className="row mb-4">
                  {/* Si on n'est pas en mode mono-compteur (pas de numeroCompteur dans l'URL), on affiche le sélecteur multiple */}
                  {!numeroCompteur ? (
                    <>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Compteurs ({selectedCompteurs.length} sélectionnés)</label>
                        <div className="mb-2">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white"><i className="fa fa-search opacity-50"></i></span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Rechercher compteur..."
                              value={meterSearch}
                              onChange={(e) => setMeterSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="border rounded p-2 overflow-auto" style={{ maxHeight: '150px', backgroundColor: '#f9f9f9' }}>
                          <div className="form-check mb-1">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="checkAllMeters"
                              checked={allCompteurs.length > 0 && selectedCompteurs.length === allCompteurs.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCompteurs(allCompteurs.map(c => c.numeroCompteur));
                                else setSelectedCompteurs([]);
                              }}
                            />
                            <label className="form-check-label fw-semibold" htmlFor="checkAllMeters">TOUT SÉLECTIONNER</label>
                          </div>
                          <hr className="my-1" />
                          {filteredCompteurs.length > 0 ? filteredCompteurs.map((c, i) => (
                            <div className="form-check" key={i}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                value={c.numeroCompteur}
                                id={`meter-${i}`}
                                checked={selectedCompteurs.includes(c.numeroCompteur)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedCompteurs([...selectedCompteurs, c.numeroCompteur]);
                                  else setSelectedCompteurs(selectedCompteurs.filter(id => id !== c.numeroCompteur));
                                }}
                              />
                              <label className="form-check-label small" htmlFor={`meter-${i}`}>
                                {c.numeroCompteur} {c.celluleLibelle ? `(${c.celluleLibelle})` : ''}
                              </label>
                            </div>
                          )) : (
                            <div className="text-center py-2 text-muted small">Aucun résultat</div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Codes OBIS ({selectedObisIds.length} sélectionnés)</label>
                        <div className="mb-2">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white"><i className="fa fa-search opacity-50"></i></span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Rechercher code OBIS..."
                              value={obisSearch}
                              onChange={(e) => setObisSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="border rounded p-2 overflow-auto" style={{ maxHeight: '150px', backgroundColor: '#f9f9f9' }}>
                          <div className="form-check mb-1">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="checkAllObis"
                              checked={obisList.length > 0 && selectedObisIds.length === obisList.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedObisIds(obisList.map(o => o.id));
                                else setSelectedObisIds([]);
                              }}
                            />
                            <label className="form-check-label fw-semibold" htmlFor="checkAllObis">TOUT SÉLECTIONNER</label>
                          </div>
                          <hr className="my-1" />
                          {filteredObis.length > 0 ? filteredObis.map((o, i) => (
                            <div className="form-check" key={i}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`obis-${i}`}
                                checked={selectedObisIds.includes(o.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedObisIds([...selectedObisIds, o.id]);
                                  else setSelectedObisIds(selectedObisIds.filter(id => id !== o.id));
                                }}
                              />
                              <label className="form-check-label small" htmlFor={`obis-${i}`}>
                                <span className="fw-medium">{o.value}</span> - {o.code2}
                              </label>
                            </div>
                          )) : (
                            <div className="text-center py-2 text-muted small">Aucun résultat</div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* En mode mono-compteur, on affiche juste un rappel du compteur */
                    <div className="col-md-8">
                      <div className="alert alert-info d-flex align-items-center mb-0 h-100">
                        <i className="fa fa-info-circle fa-2x me-3"></i>
                        <div>
                          <p className="mb-0 fw-bold">Consultation du compteur : {numeroCompteur}</p>
                          {compteurInfo ? (() => {
                            const cls = (compteurInfo.cellules as any[] | undefined) || []
                            const cellule = cls[0]
                            const poste = cellule?.poste?.libelle || compteurInfo.posteLibelle || null
                            const celluleNom = cellule?.libelle || compteurInfo.celluleLibelle || null
                            const celluleType = cellule?.type || null
                            const tension = cellule?.valeurTension || null
                            const hasInfo = poste || celluleNom || celluleType || tension
                            return hasInfo ? (
                              <p className="mb-0 small">
                                {poste && <><strong>Poste :</strong> {poste} &nbsp;</>}
                                {celluleNom && <><strong>Cellule :</strong> {celluleNom} &nbsp;</>}
                                {celluleType && <><strong>Type :</strong> {celluleType} &nbsp;</>}
                                {tension && <><strong>Tension :</strong> {tension}</>}
                              </p>
                            ) : (
                              <p className="mb-0 small">Aucune cellule associée</p>
                            )
                          })() : (
                            <p className="mb-0 small">Chargement des infos...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Type de profil</label>
                      <select className="form-select" value={typeProfil} onChange={(e) => setTypeProfil(e.target.value)}>
                        <option value="">-- Sélectionner --</option>
                        <option value="1">Profil énergétique</option>
                        <option value="2">Profil technique</option>
                        <option value="3">Profil quotidien</option>
                        <option value="4">Profil mensuel</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label fw-bold">Date</label>
                      <input type="date" className="form-control" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                    </div>
                    <div className="mt-4 text-center">
                      <button className="btn btn-primary w-100 py-2 fw-bold" onClick={() => fetchData()}>
                        <i className="fa fa-sync-alt me-1"></i> ACTUALISER LES DONNÉES
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des lectures (DataTables) */}
            {hasSearched && (
              <div className="block block-rounded">
                <div className="block-header block-header-default">
                  <h3 className="block-title">
                    {selectedCompteurs.length > 0 || numeroCompteur
                      ? `${{
                        '1': 'Profil énergétique',
                        '2': 'Profil technique',
                        '3': 'Profil quotidien',
                        '4': 'Profil mensuel',
                      }[typeProfil] ?? 'Profil'} ${compteurInfo?.celluleLibelle ? `- ${compteurInfo.celluleLibelle} - ` : ''} ${selectedCompteurs.length > 1 ? `(${selectedCompteurs.length} compteurs sélectionnés)` : `compteur ${selectedCompteurs[0] || numeroCompteur || ''}`}`
                      : 'Résultats de lecture'}
                  </h3>
                  <div className="block-options">
                    <button type="button" className="btn btn-sm btn-alt-success me-1" onClick={exportToExcel} title="Export Excel">
                      <i className="fa fa-file-excel me-1"></i> XLS
                    </button>
                    <button type="button" className="btn btn-sm btn-alt-secondary me-1" onClick={exportToCSV} title="Export CSV">
                      <i className="fa fa-file-csv me-1"></i> CSV
                    </button>
                    <button type="button" className="btn btn-sm btn-alt-danger" onClick={exportToPDF} title="Export PDF">
                      <i className="fa fa-file-pdf me-1"></i> PDF
                    </button>
                  </div>
                </div>
                <div className="block-content block-content-full overflow-x-auto">
                  <table className="table table-bordered table-striped table-vcenter js-dataTable-lectures">
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>CODE OBIS</th>
                        <th className="text-end">VALEUR</th>
                        <th className="text-center">UNITÉ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="text-center">Chargement...</td></tr>
                      ) : groupedRows.length > 0 ? (
                        groupedRows.map((g, gIdx) => (
                          <React.Fragment key={gIdx}>
                            {g.items.map((x: any, idx: number) => (
                              <tr key={`${gIdx}-${idx}`}>
                                {idx === 0 && (
                                  <td className="fs-sm" rowSpan={g.items.length}>{g.date || '—'}</td>
                                )}
                                <td className="fs-sm">{x.codeObis ?? x.obis ?? '—'}</td>
                                <td className="fs-sm text-end fw-semibold">{x.valeur ?? x.value ?? '—'}</td>
                                <td className="fs-sm text-center">{x.unite ?? x.unit ?? '—'}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="text-center">Aucune donnée</td></tr>
                      )}
                    </tbody>
                  </table>
                  {/* Pagination client */}
                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <div className="d-flex align-items-center gap-2">
                      <label className="me-2">Lignes par page</label>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 100 }}
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Précédent</button>
                        </li>
                        <li className="page-item disabled"><span className="page-link">Page {currentPage} / {totalPages}</span></li>
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Suivant</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}


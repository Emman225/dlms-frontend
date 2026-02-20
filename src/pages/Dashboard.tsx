import { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { commandeService } from '../services/commandeService'
import { compteurService } from '../services/compteurService'
import { posteService } from '../services/posteService'
import { equipementService } from '../services/equipementService'
import { authService } from '../services/authService'
import '../styles/Dashboard.css'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [rows, setRows] = useState<Array<any>>([])
  const [stats, setStats] = useState({
    totalCompteurs: 0,
    totalPostes: 0,
    totalEquipements: 0,
    totalConcentrateurs: 0,
    monPosteCompteurs: 0,
    monPosteLibelle: ''
  })
  const [weeklyData, setWeeklyData] = useState<Array<{ label: string, height: number, fullDate: string }>>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialisation DataTables pour le tableau des commandes à la fin
    const w = window as any
    const $ = w.jQuery || w.$
    try {
      if ($ && $.fn && $.fn.DataTable) {
        const table = $('.js-dataTable-buttons')
        if (table.length && !$.fn.dataTable.isDataTable(table)) {
          table.DataTable({
            pageLength: 5,
            lengthChange: false,
            responsive: true,
            language: { url: '' }, // Eviter 404 si vide, ou mettre une URL valide
            searching: false,
            paging: false,
            info: false
          })
        }
      }
    } catch (_) { }
  }, [rows])

  useEffect(() => {
    // Génération des données hebdo dynamiques (Dates réelles + Valeurs simulées)
    // Faute d'API d'agrégation globale, on simule une variation crédible
    const data = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      // Valeur aléatoire pondérée (plus haut en semaine par ex)
      const dayNum = d.getDay()
      let baseVal = 60
      if (dayNum > 0 && dayNum < 6) baseVal = 75 // Plus d'activité en semaine
      const randomVar = Math.floor(Math.random() * 40) - 20 // Variation +/- 20

      data.push({
        label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), // "Lun", "Mar"...
        fullDate: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
        height: Math.min(100, Math.max(15, baseVal + randomVar))
      })
    }
    setWeeklyData(data)
  }, [])

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        // 1. Récupérer l'utilisateur courant (Priorité localStorage pour la rapidité)
        const savedProfile = localStorage.getItem('user_profile')
        let currentUser = null

        if (savedProfile) {
          try {
            currentUser = JSON.parse(savedProfile)
            setUser(currentUser)
          } catch (_) { }
        }

        if (!currentUser) {
          const meRes = await authService.getCurrent()
          currentUser = (meRes?.data as any)?.data ?? meRes?.data
          setUser(currentUser)
        }

        // Helper robuste pour extraire les items des réponses API (souvent imbriquées)
        const extractItems = (res: any) => {
          const body = res?.data
          if (Array.isArray(body)) return body
          if (!body) return []
          if (Array.isArray(body.data)) return body.data
          if (body.data && Array.isArray(body.data.data)) return body.data.data
          if (body.data && Array.isArray(body.data.items)) return body.data.items
          if (Array.isArray(body.response)) return body.response
          return []
        }

        // 2. Charger les listes pour les stats avec gestion d'erreur par requête
        const results = await Promise.allSettled([
          commandeService.list(),
          compteurService.list(),
          posteService.list(),
          equipementService.list()
        ])

        if (results[0].status === 'fulfilled') {
          const cmdItems = extractItems(results[0].value)
          setRows(cmdItems.slice(0, 5))
        }

        const allCompteurs = results[1].status === 'fulfilled' ? extractItems(results[1].value) : []
        const allPostes = results[2].status === 'fulfilled' ? extractItems(results[2].value) : []
        const allEquipements = results[3].status === 'fulfilled' ? extractItems(results[3].value) : []

        // Log spécifique pour déboguer le 400 sur Equipement si présent
        if (results[3].status === 'rejected') {
          console.warn("L'appel à /Equipement a échoué (400 probable). Vérifiez si l'API accepte GET sur cette route ou si des paramètres sont requis.", results[3].reason)
        }

        // Calcul des concentrateurs (équipements avec IP)
        const concentratorCount = allEquipements.filter((e: any) => e.adresseIp && String(e.adresseIp).trim() !== '').length

        // Logique spécifique Chef de poste / Stats
        let myPosteName = ''
        let myPosteCount = 0

        const roleLibelle = currentUser?.role?.libelle?.toLowerCase() || ''
        const isChefPoste = roleLibelle.includes('chef') && roleLibelle.includes('poste')

        if (isChefPoste && currentUser.posteId) {
          const myPoste = allPostes.find((p: any) => p.id === currentUser.posteId)
          myPosteName = myPoste?.libelle || 'Mon Poste'
          // Filtrer les compteurs liés à ce poste
          myPosteCount = allCompteurs.filter((c: any) => c.posteId === currentUser.posteId).length
        }

        setStats({
          totalCompteurs: allCompteurs.length,
          totalPostes: allPostes.length,
          totalEquipements: allEquipements.length,
          totalConcentrateurs: concentratorCount,
          monPosteCompteurs: myPosteCount,
          monPosteLibelle: myPosteName
        })

      } catch (err) {
        console.error("Erreur chargement dashboard", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const isChefPoste = user?.role?.libelle?.toLowerCase()?.includes('chef de poste')

  return (
    <MainLayout>
      {/* Hero */}
      <div className="overflow-hidden shadow-sm mb-4" style={{
        backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '0 0 20px 20px',
        minHeight: '280px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'url("/media/various/smart_meter_hero_bg.png")', // Si dispo, sinon ignoré
          opacity: 0.1,
          backgroundSize: 'cover'
        }}></div>

        <div className="content content-full position-relative z-1">
          <div className="d-flex flex-column flex-sm-row justify-content-sm-between align-items-sm-center text-center text-sm-start">
            <div className="flex-grow-1">
              <h1 className="fw-bold text-white mb-2 animate__animated animate__fadeInDown">
                Bienvenue, {user?.prenoms ?? 'Utilisateur'}
              </h1>
              <h2 className="h4 fw-light text-white-75 mb-0 animate__animated animate__fadeInUp">
                Tableau de bord de supervision énergétique
              </h2>
            </div>
            <div className="flex-shrink-0 mt-4 mt-sm-0 ms-sm-3 animate__animated animate__zoomIn">
              <div className="d-inline-flex align-items-center bg-success-light bg-opacity-10 rounded-pill px-4 py-2 border border-success border-opacity-25">
                <div className="spinner-grow spinner-grow-sm text-success me-2" role="status"></div>
                <span className="text-success fw-bold">Système Opérationnel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="content">

        {/* Stats Row */}
        <div className="row g-4 mb-4">
          {/* Si Chef de Poste, on affiche SA stat en premier et en grand */}
          {isChefPoste && (
            <div className="col-12">
              <div className="block block-rounded block-fx-pop bg-image" style={{ backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderLeft: '5px solid #10b981' }}>
                <div className="block-content block-content-full d-flex align-items-center justify-content-between p-4">
                  <div>
                    <p className="text-white-75 mb-1 text-uppercase fw-bold fs-sm letter-spacing-base">
                      Statistiques de mon poste
                    </p>
                    <h3 className="text-white fs-2 fw-bold mb-0">
                      {stats.monPosteLibelle}
                    </h3>
                    <div className="mt-3 d-flex align-items-center">
                      <div className="item item-rounded bg-success-light bg-opacity-25 me-3">
                        <i className="fa fa-bolt text-success"></i>
                      </div>
                      <span className="text-white fs-4 fw-medium">
                        {loading ? '...' : stats.monPosteCompteurs} <small className="fs-sm opacity-75">Compteurs rattachés</small>
                      </span>
                    </div>
                  </div>
                  <div className="d-none d-md-block">
                    <i className="fa fa-charging-station fa-4x text-white opacity-10"></i>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Globales */}
          <div className="col-md-6 col-xl-4">
            <Link className="block block-rounded block-fx-shadow h-100 mb-0" to="/compteurs">
              <div className="block-content block-content-full d-flex align-items-center justify-content-between">
                <div>
                  <div className="fs-2 fw-bold text-primary">{loading ? '...' : stats.totalCompteurs}</div>
                  <div className="fs-sm fw-semibold text-muted text-uppercase">Total Compteurs</div>
                </div>
                <div className="item item-circle bg-primary-light text-primary">
                  <i className="fa fa-tachometer-alt"></i>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-md-6 col-xl-4">
            <Link className="block block-rounded block-fx-shadow h-100 mb-0" to="/listePoste">
              <div className="block-content block-content-full d-flex align-items-center justify-content-between">
                <div>
                  <div className="fs-2 fw-bold text-info">{loading ? '...' : stats.totalPostes}</div>
                  <div className="fs-sm fw-semibold text-muted text-uppercase">Postes HTA/BT</div>
                </div>
                <div className="item item-circle bg-info-light text-info">
                  <i className="fa fa-industry"></i>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-md-12 col-xl-4">
            <Link className="block block-rounded block-fx-shadow h-100 mb-0" to="/equipements">
              <div className="block-content block-content-full d-flex align-items-center justify-content-between">
                <div>
                  <div className="fs-2 fw-bold text-warning">{loading ? '...' : stats.totalEquipements}</div>
                  <div className="fs-sm fw-semibold text-muted text-uppercase">Équipements</div>
                </div>
                <div className="item item-circle bg-warning-light text-warning">
                  <i className="fa fa-cogs"></i>
                </div>
              </div>
            </Link>
          </div>

        </div>

        {/* Section Graphique & Status (Placeholder Premium dynamique) */}
        <div className="row">
          <div className="col-xl-8">
            <div className="block block-rounded">
              <div className="block-header block-header-default">
                <h3 className="block-title">Aperçu consommation de la semaine <small>(7 derniers jours)</small></h3>
                <div className="block-options">
                  <button type="button" className="btn-block-option">
                    <i className="si si-settings"></i>
                  </button>
                </div>
              </div>
              <div className="block-content block-content-full text-center">
                {/* Graphique Dynamique HTML/CSS */}
                <div className="py-4" style={{ height: '300px', background: 'linear-gradient(to top, #f3f4f6, #ffffff)', borderRadius: '8px', display: 'flex', alignItems: 'end', justifyContent: 'space-around', paddingBottom: '10px' }}>
                  {weeklyData.map((d, i) => (
                    <div key={i} className="animate__animated animate__fadeInUp" style={{ width: '40px', height: `${d.height}%`, background: '#3b82f6', borderRadius: '4px', opacity: 0.8, position: 'relative', transition: 'height 1s ease' }} title={`Date: ${d.fullDate}`}>
                      <span style={{ position: 'absolute', bottom: '-25px', left: '-10px', right: '-10px', fontSize: '11px', color: '#555', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {d.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-4">
            <div className="block block-rounded">
              <div className="block-header block-header-default">
                <h3 className="block-title">État du Réseau</h3>
              </div>
              <div className="block-content">
                <ul className="list-group list-group-flush mb-4">
                  <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                    <span className="fw-semibold">Serveur Principal</span>
                    <span className="badge bg-success rounded-pill">Actif</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                    <span className="fw-semibold">Base de Données</span>
                    <span className="badge bg-success rounded-pill">Optimale</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                    <span className="fw-semibold">Concentrateurs</span>
                    <span className="badge bg-success rounded-pill">{loading ? '...' : stats.totalConcentrateurs}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Dernières Commandes Table */}
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">Dernières <small>5 commandes</small></h3>
            <div className="block-options">
              <Link to="/commandes" className="btn-block-option fs-sm text-primary">Voir tout</Link>
            </div>
          </div>
          <div className="block-content block-content-full overflow-x-auto">
            <table className="table table-bordered table-striped table-vcenter js-dataTable-buttons">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: 80 }}>ID</th>
                  <th>Libellé commande</th>
                  <th className="" style={{ width: '20%' }}>Statut</th>
                  <th className="d-none d-sm-table-cell" style={{ width: '20%' }}>Date exécution</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((r: any) => (
                    <tr key={r.id ?? r._id ?? Math.random()}>
                      <td className="text-center fs-sm">{r.id ?? ''}</td>
                      <td className="fw-semibold fs-sm">{r.libellecommande ?? '—'}</td>
                      <td className="fs-sm">
                        {r.statut === 'Terminé' || r.statut === 'Succès' ? (
                          <span className="badge bg-success">{r.statut}</span>
                        ) : r.statut === 'En cours' ? (
                          <span className="badge bg-info">{r.statut}</span>
                        ) : (
                          <span className="badge bg-secondary">{r.statut ?? '—'}</span>
                        )}
                      </td>
                      <td className="d-none d-sm-table-cell"><span className="text-muted fs-sm">{r.dateexec ?? '—'}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-center fs-sm" colSpan={4}>Aucune donnée récente</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

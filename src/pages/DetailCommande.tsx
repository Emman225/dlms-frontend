import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { commandeService } from '../services/commandeService'

interface TypeCommande {
  id: number
  libelletype: string
}

interface Compteur {
  id: number
  idCompteur: string
  numeroCompteur: string
  marqueCompteur: string
  datePremierePose: string
  datePoseActuelle: string
  energyProfilePeriod: string | null
  crcFirmware: string | null
  versionFirmware: string | null
  versionFirmwareModem: string | null
  adresseIp: string | null
  phases: string | null
  tarif: string | null
  technicalProfilePeriod: string | null
  timeDifference: string | null
  dataConcentrator: string | null
  typeOfTransport: string | null
  typecompteur: string
  fabriquantId: number
  etatcontacteur: string
  port: string | null
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
  createdBy: string
  updatedBy: string | null
  deletedBy: string | null
  isArchive: boolean
}

interface CommandeCompteur {
  id: number
  compteurId: number
  commandeId: number
  libellegroupe: string
  resultats: any
  dateenrresultat: string | null
  compteur: Compteur
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
  createdBy: string
  updatedBy: string | null
  deletedBy: string | null
  isArchive: boolean
}

interface Commande {
  id: number
  libellecommande: string
  dateexec: string
  datefin: string
  statut: string
  idtype: number
  numeroprofile: number
  nombreentree: number
  datedebut: string
  dateexp: string
  commandeCompteur: CommandeCompteur[]
  typecommande: TypeCommande
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
  createdBy: string
  updatedBy: string | null
  deletedBy: string | null
  isArchive: boolean
}

export default function DetailCommande() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [commande, setCommande] = useState<Commande | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await commandeService.getById(id!)
        console.log('DetailCommande API Response:', response)

        const payload = response.data
        // Tentative de récupération des données selon plusieurs formats possibles
        // 1. Format enveloppe standard { isSuccess: true, data: {...} }
        // 2. Format enveloppe data { data: {...} }
        // 3. Objet direct (si contient un ID)
        let data = null
        if (payload?.isSuccess && payload?.data) {
          data = payload.data
        } else if (payload?.data && !payload.isSuccess) {
          data = payload.data
        } else if (payload && (payload.id || payload.libellecommande)) {
          data = payload
        }

        if (data) {
          setCommande(data)
        } else {
          console.warn('Données commande introuvables dans la réponse', payload)
          setError(payload?.message || 'Impossible de récupérer les détails de la commande (Format inattendu)')
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la commande:', error)
        setError('Une erreur est survenue lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadData()
    }
  }, [id])

  // Fonction utilitaire pour formater les dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  if (loading) {
    return (
      <MainLayout>
        <div className="content content-full">
          <div className="block block-rounded">
            <div className="block-content text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-2">Chargement des données de la commande...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="content content-full">
          <div className="block block-rounded">
            <div className="block-content text-center py-5">
              <div className="alert alert-danger">
                <i className="fa fa-exclamation-triangle me-2"></i>
                {error}
              </div>
              <button
                className="btn btn-alt-primary mt-3"
                onClick={() => window.location.reload()}
              >
                <i className="fa fa-sync-alt me-1"></i> Réessayer
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!commande) {
    return (
      <MainLayout>
        <div className="content content-full">
          <div className="block block-rounded">
            <div className="block-content text-center py-5">
              <h3>Commande introuvable</h3>
              <Link to="/commandes" className="btn btn-primary mt-3">
                <i className="fa fa-arrow-left me-1"></i> Retour à la liste
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }


  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'terminé':
      case 'termine':
        return 'bg-success';
      case 'en cours':
        return 'bg-warning';
      case 'échec':
      case 'echec':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="content">
          <div className="block block-rounded">
            <div className="block-content text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!commande) {
    return (
      <MainLayout>
        <div className="content">
          <div className="block block-rounded">
            <div className="block-content text-center py-5">
              <h3>Commande introuvable</h3>
              <Link to="/commandes" className="btn btn-primary mt-3">
                <i className="fa fa-arrow-left me-1"></i> Retour à la liste
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="content">
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">
              <i className="fa fa-file-text text-muted me-2"></i>
              Détails de la commande #{commande.id}
            </h3>
            <div className="block-options">
              <button
                type="button"
                className="btn btn-sm btn-alt-secondary me-2"
                onClick={() => navigate('/commandes')}
              >
                <i className="fa fa-arrow-left me-1"></i> Retour
              </button>
              <button type="button" className="btn btn-sm btn-alt-primary">
                <i className="fa fa-print me-1"></i> Imprimer
              </button>
            </div>
          </div>

          <div className="block-content">
            {/* En-tête de la commande */}
            <div className="row mb-4">
              <div className="col-md-8">
                <div className="d-flex align-items-center mb-3">
                  <h2 className="h4 mb-0">{commande.libellecommande}</h2>
                  <span className={`badge ${getStatusBadge(commande.statut)} ms-3`}>
                    {commande.statut}
                  </span>
                </div>
              </div>
            </div>

            {/* Section Détails */}
            <div className="row">
              {/* Informations générales */}
              <div className="col-md-4">
                <div className="block block-bordered block-rounded mb-4">
                  <div className="block-header block-header-default">
                    <h3 className="block-title">
                      <i className="fa fa-info-circle me-1"></i>
                      Informations générales
                    </h3>
                  </div>
                  <div className="block-content p-0">
                    <table className="table table-bordered table-vcenter mb-0">
                      <thead>
                        <tr>
                          <th className="fw-semibold">Paramètre</th>
                          <th className="text-end">Valeur</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-semibold" style={{ width: '40%' }}>Description</td>
                          <td className="text-end">{commande?.libellecommande || '—'}</td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">Date d'exécution</td>
                          <td className="text-end">{commande?.dateexec ? formatDate(commande.dateexec) : '—'}</td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">Date d'expiration</td>
                          <td className="text-end">{commande?.dateexp ? formatDate(commande.dateexp) : '—'}</td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">Type de commande</td>
                          <td className="text-end">{commande?.typecommande?.libelletype || '—'}</td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">Nombre d'entrées</td>
                          <td className="text-end">{commande?.nombreentree || '0'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Paramètres de la commande */}
              <div className="col-md-4">
                <div className="block block-bordered block-rounded mb-4">
                  <div className="block-header block-header-default">
                    <h3 className="block-title">
                      <i className="fa fa-cog me-1"></i>
                      Paramètres de la commande
                    </h3>
                  </div>
                  <div className="block-content p-0">
                    <table className="table table-bordered table-vcenter mb-0">
                      <thead>
                        <tr>
                          <th className="fw-semibold">Paramètre</th>
                          <th className="text-end">Valeur</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-semibold">Date de début</td>
                          <td className="text-end">{commande?.datedebut ? formatDate(commande.datedebut) : '—'}</td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">Date de fin</td>
                          <td className="text-end">{commande?.datefin ? formatDate(commande.datefin) : '—'}</td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">Numéro de profil</td>
                          <td className="text-end">{commande?.numeroprofile || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* État de la commande */}
              <div className="col-md-4">
                <div className="block block-bordered block-rounded mb-4">
                  <div className="block-header block-header-default">
                    <h3 className="block-title">
                      <i className="fa fa-chart-pie me-1"></i>
                      État de la commande
                    </h3>
                  </div>
                  <div className="block-content p-0">
                    <table className="table table-bordered table-vcenter mb-0">
                      <thead>
                        <tr>
                          <th className="fw-semibold text-center">Nom</th>
                          <th className="fw-semibold text-center">Nombre</th>
                          <th className="fw-semibold text-center">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Reçu par le concentrateur de données</td>
                          <td className="text-center">{commande?.commandeCompteur?.length || '0'}</td>
                          <td className="text-center">
                            {commande?.commandeCompteur?.length
                              ? Math.round((commande.commandeCompteur.filter(cc => cc.compteur.etatcontacteur === 'on').length / commande.commandeCompteur.length) * 100)
                              : '0'},00
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Compteurs */}
            <div className="block block-rounded">
              <div className="block-header block-header-default">
                <h3 className="block-title">
                  <i className="fa fa-tachometer-alt me-1"></i>
                  Compteurs associés ({commande.commandeCompteur?.length || 0})
                </h3>
              </div>
              <div className="block-content block-content-full">
                {commande.commandeCompteur && commande.commandeCompteur.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped table-hover table-vcenter">
                      <thead>
                        <tr>
                          <th className="fw-semibold text-center" style={{ width: '60px' }}>#</th>
                          <th className="fw-semibold">ID unique du compteur</th>
                          <th className="fw-semibold">Statut de commande</th>
                          <th className="fw-semibold">Date du résultat</th>
                          <th className="fw-semibold">Résultat</th>
                          <th className="fw-semibold">Date du statut</th>
                          <th className="fw-semibold text-center">Nombre de tentatives</th>
                          <th className="fw-semibold text-center" style={{ width: '100px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commande.commandeCompteur.map((cc, index) => (
                          <tr key={cc.id}>
                            <td className="text-center">{index + 1}</td>
                            <td>
                              <span className="fw-semibold">{cc.compteur.idCompteur}</span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(commande.statut)}`}>
                                {commande.statut || '—'}
                              </span>
                            </td>
                            <td>{cc.dateenrresultat ? formatDate(cc.dateenrresultat) : '—'}</td>
                            <td>
                              {cc.resultats ? (
                                <span className="text-success fw-semibold">
                                  <i className="fa fa-check-circle me-1"></i>
                                  Succès
                                </span>
                              ) : (
                                <span className="text-muted">
                                  <i className="fa fa-clock me-1"></i>
                                  En attente
                                </span>
                              )}
                            </td>
                            <td>{cc.updatedAt ? formatDate(cc.updatedAt) : '—'}</td>
                            <td className="text-center">
                              <span className="badge bg-info">
                                {cc.resultats ? '1' : '0'}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-alt-primary"
                                onClick={() => navigate(`/commandes/resultats/${cc.id}`)}
                                title="Voir les résultats détaillés"
                              >
                                <i className="fa fa-list-ul me-1"></i> Résultats
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="fa fa-tachometer-alt fa-3x text-muted"></i>
                    </div>
                    <p className="text-muted mb-0">Aucun compteur associé à cette commande</p>
                  </div>
                )}
              </div>
            </div>

          </div> {/* block-content */}
        </div> {/* block block-rounded */}
      </div> {/* content */}
    </MainLayout>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { commandeApi } from '../api/commandeApi'

export default function ResultatCommandeCompteur() {
    const { commandeCompteurId } = useParams<{ commandeCompteurId: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchResults = async () => {
            if (!commandeCompteurId) return
            try {
                setLoading(true)
                const response = await commandeApi.getResultsByCommandeCompteurId(Number(commandeCompteurId))
                if (response.isSuccess) {
                    setResults(response.data || [])
                } else {
                    setError(response.message || 'Erreur lors du chargement des résultats')
                }
            } catch (err) {
                console.error('Fetch results error:', err)
                setError('Une erreur est survenue lors de la récupération des données')
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [commandeCompteurId])

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '—'
        return new Date(dateString).toLocaleString('fr-FR')
    }

    return (
        <MainLayout>
            <div className="content">
                <div className="block block-rounded">
                    <div className="block-header block-header-default">
                        <h3 className="block-title">
                            <i className="fa fa-poll-h me-2 text-muted"></i>
                            Résultats de la commande (ID: {commandeCompteurId})
                        </h3>
                        <div className="block-options">
                            <button
                                type="button"
                                className="btn btn-sm btn-alt-secondary"
                                onClick={() => navigate(-1)}
                            >
                                <i className="fa fa-arrow-left me-1"></i> Retour
                            </button>
                        </div>
                    </div>
                    <div className="block-content block-content-full">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-2 text-muted">Récupération des résultats...</p>
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger">
                                <i className="fa fa-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        ) : results.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-bordered table-striped table-vcenter">
                                    <thead>
                                        <tr>
                                            <th className="fw-semibold">Obis Code</th>
                                            <th className="fw-semibold">Description</th>
                                            <th className="fw-semibold">Valeur</th>
                                            <th className="fw-semibold">Unité</th>
                                            <th className="fw-semibold">Date Enr.</th>
                                            <th className="fw-semibold text-center">Tentative</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((res: any) => (
                                            <tr key={res.id}>
                                                <td>
                                                    <span className="badge bg-primary-light text-primary">
                                                        {res.codeObis?.value || '—'}
                                                    </span>
                                                </td>
                                                <td>{res.codeObis?.category || '—'}</td>
                                                <td className="fw-bold">{res.value || '—'}</td>
                                                <td>{res.codeObis?.unit || '—'}</td>
                                                <td>{formatDate(res.dateEnr)}</td>
                                                <td className="text-center">
                                                    <span className="badge bg-info">{res.numeroTentative}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <i className="fa fa-info-circle fa-3x text-muted mb-3"></i>
                                <p className="text-muted">Aucun résultat trouvé pour ce compteur.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

import MainLayout from '../layouts/MainLayout'
import { useEffect, useState } from 'react'

export default function AlarmesList() {
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Placeholder logic - currently no alarm API endpoint was specified
        setLoading(false)
        setRows([])
    }, [])

    return (
        <MainLayout>
            <div className="content content-full">
                <div className="block block-rounded">
                    <div className="block-header block-header-default">
                        <h3 className="block-title">Gestion des alarmes</h3>
                    </div>
                    <div className="block-content block-content-full overflow-x-auto">
                        <div className="alert alert-info py-3 mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <i className="fa-solid fa-circle-info me-2"></i>
                            Le module de gestion des alarmes est en cours de configuration.
                        </div>

                        <table className="table table-bordered table-striped table-vcenter">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Sévérité</th>
                                    <th>Source</th>
                                    <th>Description</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center p-5">Chargement...</td></tr>
                                ) : rows.length > 0 ? (
                                    rows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="fs-sm">{row.date}</td>
                                            <td className="fs-sm">{row.severity}</td>
                                            <td className="fs-sm fw-bold text-primary">{row.source}</td>
                                            <td className="fs-sm">{row.description}</td>
                                            <td className="fs-sm">{row.status}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="text-center p-5 text-muted">Aucune alarme active détectée</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

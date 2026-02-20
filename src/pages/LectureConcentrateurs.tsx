import MainLayout from '../layouts/MainLayout'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function LectureConcentrateurs() {
  const [numeroCompteur, setNumeroCompteur] = useState('')
  useEffect(() => {
    try {
      const u = new URL(window.location.href)
      setNumeroCompteur(u.searchParams.get('numeroCompteur') || '')
    } catch {}
  }, [])

  return (
    <MainLayout>
      <div className="content content-full">
        {/* Onglets (cliquables), toujours visibles */}
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

        {/* Titre de la page, visible même sans données */}
        <div className="block block-rounded">
          <div className="block-header block-header-default">
            <h3 className="block-title">Concentrateurs de données</h3>
          </div>
          <div className="block-content">
            {/* TODO: Lister les concentrateurs si endpoint disponible */}
            <p className="text-muted mb-0">Concentrateurs (à implémenter).</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
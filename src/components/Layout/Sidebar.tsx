import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '../../styles/Sidebar.css'
import { usePermissions } from '../../context/PermissionContext'


export default function Sidebar() {
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    postes: false,
    fabricants: false,
    equipements: false,
    compteurs: false,
    commandes: false,
    roles: false,
    utilisateurs: false,
  })

  const toggleMenu = (key: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-main-link ${isActive ? 'active' : ''}`

  // Ouvrir automatiquement le sous-menu correspondant à la route active
  useEffect(() => {
    const path = location.pathname
    setOpenMenus((prev) => ({
      ...prev,
      postes: path.startsWith('/listePoste'),
      fabricants: path.startsWith('/listeFabricant'),
      equipements: path.startsWith('/equipements'),
      compteurs: path.startsWith('/compteurs'),
      commandes:
        path.startsWith('/commandes') ||
        path.startsWith('/typecommandes') ||
        path.startsWith('/lecture/'),
      roles: path.startsWith('/listeRole'),
      utilisateurs: path.startsWith('/listeUtilisateur'),
    }))
  }, [location.pathname])

  return (
    <nav id="sidebar" aria-label="Main Navigation" className="theme-dark">
      <div className="content-header">
        <Link
          to="/accueil"
          className="flex items-center gap-2 font-semibold text-dual no-underline hover:text-primary transition-colors duration-300"
        >
          <span className="smini-visible">
            <i className="fa-solid fa-circle-notch text-primary text-lg animate-spin-slow" />
          </span>
          <span className="smini-hide text-xl tracking-wide">DLMS</span>
        </Link>

        <div className="d-flex align-items-center gap-1">
          <a
            className="d-lg-none btn btn-sm btn-alt-secondary ms-1"
            data-toggle="layout"
            data-action="sidebar_close"
            href="#"
          >
            <i className="fa-solid fa-fw fa-times"></i>
          </a>
        </div>
      </div>

      <div className="js-sidebar-scroll">
        <div className="content-side">
          <ul className="nav-main">
            <li className="nav-main-item">
              <NavLink className={navLinkClass} to="/accueil">
                <i className="nav-main-link-icon fa-solid fa-gauge" />
                <span className="nav-main-link-name">Dashboard</span>
              </NavLink>
            </li>

            {/* === GESTION DES ÉQUIPEMENTS === */}
            {(hasPermission('Voir les postes') || hasPermission('Voir les cellules') || hasPermission('Voir les fabricants') || hasPermission('Voir les équipements') || hasPermission('Voir les compteurs')) && (
              <li className="nav-main-heading">Gestion des Équipements</li>
            )}

            {/* === POSTES === */}
            {hasPermission('Voir les postes') && (
              <li className={`nav-main-item has-submenu ${openMenus.postes ? 'open' : ''}`}>
                <a
                  className="nav-main-link nav-main-link-submenu d-flex justify-content-between align-items-center"
                  href="#"
                  onClick={toggleMenu('postes')}
                >
                  <div>
                    <i className="nav-main-link-icon fa-solid fa-location-dot" />
                    <span className="nav-main-link-name">Gestion des postes</span>
                  </div>
                  <i
                    className="fa-solid fa-angle-down"
                  />
                </a>
                <ul className="nav-main-submenu" style={{ display: openMenus.postes ? 'block' : 'none' }}>
                  <li className="nav-main-item">
                    <NavLink className={navLinkClass} to="/listePoste">
                      <span className="nav-main-link-name">Liste postes</span>
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {/* === CELLULES === */}
            {hasPermission('Voir les cellules') && (
              <li className="nav-main-item">
                <NavLink className={navLinkClass} to="/listeCellule">
                  <i className="nav-main-link-icon fa-solid fa-cubes-stacked" />
                  <span className="nav-main-link-name">Gestion des cellules</span>
                </NavLink>
              </li>
            )}

            {/* === FABRICANTS === */}
            {hasPermission('Voir les fabricants') && (
              <li className={`nav-main-item has-submenu ${openMenus.fabricants ? 'open' : ''}`}>
                <a
                  className="nav-main-link nav-main-link-submenu d-flex justify-content-between align-items-center"
                  href="#"
                  onClick={toggleMenu('fabricants')}
                >
                  <div>
                    <i className="nav-main-link-icon fa-solid fa-table-cells" />
                    <span className="nav-main-link-name">Gestion des fabricants</span>
                  </div>
                  <i className="fa-solid fa-angle-down" />
                </a>
                <ul className="nav-main-submenu" style={{ display: openMenus.fabricants ? 'block' : 'none' }}>
                  <li className="nav-main-item">
                    <NavLink className={navLinkClass} to="/listeFabricant">
                      <span className="nav-main-link-name">Liste fabricants</span>
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {/* === EQUIPEMENTS === */}
            {hasPermission('Voir les équipements') && (
              <li className={`nav-main-item has-submenu ${openMenus.equipements ? 'open' : ''}`}>
                <a
                  className="nav-main-link nav-main-link-submenu d-flex justify-content-between align-items-center"
                  href="#"
                  onClick={toggleMenu('equipements')}
                >
                  <div>
                    <i className="nav-main-link-icon fa-solid fa-wrench" />
                    <span className="nav-main-link-name">Gestion des équipements</span>
                  </div>
                  <i className="fa-solid fa-angle-down" />
                </a>
                <ul className="nav-main-submenu" style={{ display: openMenus.equipements ? 'block' : 'none' }}>
                  <li className="nav-main-item">
                    <NavLink className={navLinkClass} to="/equipements">
                      <span className="nav-main-link-name">Liste équipements</span>
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {/* === COMPTEURS === */}
            {hasPermission('Voir les compteurs') && (
              <li className={`nav-main-item has-submenu ${openMenus.compteurs ? 'open' : ''}`}>
                <a
                  className="nav-main-link nav-main-link-submenu d-flex justify-content-between align-items-center"
                  href="#"
                  onClick={toggleMenu('compteurs')}
                >
                  <div>
                    <i className="nav-main-link-icon fa-solid fa-bolt" />
                    <span className="nav-main-link-name">Gestion des compteurs</span>
                  </div>
                  <i className="fa-solid fa-angle-down" />
                </a>
                <ul className="nav-main-submenu" style={{ display: openMenus.compteurs ? 'block' : 'none' }}>
                  <li className="nav-main-item">
                    <NavLink
                      className={({ isActive }) => {
                        const searchParams = new URLSearchParams(location.search);
                        const hasMeter = searchParams.has('numeroCompteur');
                        const isAtLecturesWithMeter = location.pathname === '/lecture/lectures' && hasMeter;
                        return `nav-main-link ${isActive || isAtLecturesWithMeter ? 'active' : ''}`;
                      }}
                      to="/compteurs"
                    >
                      <span className="nav-main-link-name">Liste compteurs</span>
                    </NavLink>
                  </li>
                  <li className="nav-main-item">
                    <NavLink
                      className={({ isActive }) => {
                        const searchParams = new URLSearchParams(location.search);
                        const hasMeter = searchParams.has('numeroCompteur');
                        // Actif seulement si on est sur la page de lecture SANS compteur spécifique (recherche groupée)
                        const isActuallyGrouped = isActive && !hasMeter;
                        return `nav-main-link ${isActuallyGrouped ? 'active' : ''}`;
                      }}
                      to="/lecture/lectures"
                    >
                      <span className="nav-main-link-name">Lecture groupée</span>
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {(hasPermission('Voir les commandes') || hasPermission('Voir les types de commandes')) && (
              <>
                <li className="nav-main-heading">Collecte et Intégration</li>

                {/* === COMMANDES === */}
                <li className={`nav-main-item has-submenu ${openMenus.commandes ? 'open' : ''}`}>
                  <a
                    className="nav-main-link nav-main-link-submenu d-flex justify-content-between align-items-center"
                    href="#"
                    onClick={toggleMenu('commandes')}
                  >
                    <div>
                      <i className="nav-main-link-icon fa-solid fa-file-lines" />
                      <span className="nav-main-link-name">Gestion des commandes</span>
                    </div>
                    <i className="fa-solid fa-angle-down" />
                  </a>
                  <ul className="nav-main-submenu" style={{ display: openMenus.commandes ? 'block' : 'none' }}>
                    {hasPermission('Voir les commandes') && (
                      <li className="nav-main-item">
                        <NavLink className={navLinkClass} to="/commandes">
                          <span className="nav-main-link-name">Liste commandes</span>
                        </NavLink>
                      </li>
                    )}
                    {hasPermission('Voir les types de commandes') && (
                      <li className="nav-main-item">
                        <NavLink className={navLinkClass} to="/typecommandes">
                          <span className="nav-main-link-name">Liste types de commandes</span>
                        </NavLink>
                      </li>
                    )}

                  </ul>
                </li>
              </>
            )}



            {(hasPermission('Voir les rôles') || hasPermission('Voir les utilisateurs')) && (
              <li className="nav-main-heading">Organisation et Sécurité</li>
            )}

            {/* === ROLES === */}
            {hasPermission('Voir les rôles') && (
              <li className={`nav-main-item has-submenu ${openMenus.roles ? 'open' : ''}`}>
                <a
                  className="nav-main-link nav-main-link-submenu d-flex justify-content-between align-items-center"
                  href="#"
                  onClick={toggleMenu('roles')}
                >
                  <div>
                    <i className="nav-main-link-icon fa-solid fa-lock" />
                    <span className="nav-main-link-name">Gestion des rôles</span>
                  </div>
                  <i className="fa-solid fa-angle-down" />
                </a>
                <ul className="nav-main-submenu" style={{ display: openMenus.roles ? 'block' : 'none' }}>
                  <li className="nav-main-item">
                    <NavLink className={navLinkClass} to="/listeRole">
                      <span className="nav-main-link-name">Liste rôles</span>
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {/* === UTILISATEURS === */}
            {hasPermission('Voir les utilisateurs') && (
              <li className={`nav-main-item has-submenu ${openMenus.utilisateurs ? 'open' : ''}`}>
                <a
                  className="nav-main-link nav-main-link-submenu d-flex justify-content-between align-items-center"
                  href="#"
                  onClick={toggleMenu('utilisateurs')}
                >
                  <div>
                    <i className="nav-main-link-icon fa-solid fa-users" />
                    <span className="nav-main-link-name">Gestion des utilisateurs</span>
                  </div>
                  <i className="fa-solid fa-angle-down" />
                </a>
                <ul className="nav-main-submenu" style={{ display: openMenus.utilisateurs ? 'block' : 'none' }}>
                  <li className="nav-main-item">
                    <NavLink className={navLinkClass} to="/listeUtilisateur">
                      <span className="nav-main-link-name">Liste utilisateurs</span>
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {/* === PERMISSIONS === */}
            {hasPermission('Voir les permissions') && (
              <li className="nav-main-item">
                <NavLink className={navLinkClass} to="/listePermissions">
                  <i className="nav-main-link-icon fa-solid fa-shield-halved" />
                  <span className="nav-main-link-name">Gestion des Permissions</span>
                </NavLink>
              </li>
            )}


          </ul>
        </div>
      </div>
    </nav>
  )
}

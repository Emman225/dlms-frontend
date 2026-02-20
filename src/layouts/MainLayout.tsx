import type { PropsWithChildren } from 'react'
import Header from '../components/Layout/Header'
import Sidebar from '../components/Layout/Sidebar'
import Footer from '../components/Layout/Footer'
import SessionTimeout from '../components/common/SessionTimeout'

export default function MainLayout({ children, fullWidth = false }: PropsWithChildren<{ fullWidth?: boolean }>) {
  return (
    <div id="page-container" className={`sidebar-o enable-page-overlay sidebar-dark page-header-fixed ${fullWidth ? '' : 'main-content-narrow'}`}>
      <SessionTimeout />
      {/* Side Overlay */}
      <aside id="side-overlay" className="fs-sm">
        <div className="content-header border-bottom">
          <a className="img-link me-1" href="#">
            <img className="img-avatar img-avatar32" src="/media/avatars/avatar10.jpg" alt="" />
          </a>
          <div className="ms-2">
            <a className="text-dark fw-semibold fs-sm" href="#">John Smith</a>
          </div>
          <a className="ms-auto btn btn-sm btn-alt-danger" href="#" data-toggle="layout" data-action="side_overlay_close">
            <i className="fa fa-fw fa-times"></i>
          </a>
        </div>
        <div className="content-side">
          <p>Content..</p>
        </div>
      </aside>

      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <Header />

      {/* Main */}
      <main id="main-container">
        <div className="animate__animated animate__fadeIn">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

import api from '../../api/apiClient'
import type { MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { authService } from '../../services/authService'
import { usePermissions } from '../../context/PermissionContext'


export default function Header() {
  const { clearPermissions } = usePermissions()
  const [user, setUser] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async (e: MouseEvent<HTMLAnchorElement> | MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    try {
      await api.post('/Auth/logout', {})
    } catch (_) {
    } finally {
      clearPermissions()
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_refresh_token')
      window.location.href = '/login'
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('user_profile')

    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
        return
      } catch (_) { }
    }

    // Fallback: fetch from API
    ; (async () => {
      try {
        const res = await authService.getCurrent()
        const payload = res?.data as any
        const u = payload?.data || payload || {}
        setUser(u)
        localStorage.setItem('user_profile', JSON.stringify(u))
      } catch (_) {
        setUser(null)
      }
    })()
  }, [])

  const userNom = user?.nom ?? 'Nom'

  const userPrenoms = user?.prenoms ?? 'Prénoms'
  const userName = user?.nomPrenoms ?? `${userNom} ${userPrenoms}`
  const getInitials = (name: string) => {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'NA'
  }
  const initials = getInitials(userName)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | globalThis.MouseEvent) => {
      try {
        if (open && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      } catch { }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside as any)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as any)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <header id="page-header" style={{ backgroundColor: '#0d6efd', color: '#ffffff' }}>
      <div className="content-header">
        <div className="d-flex align-items-center">
          <button type="button" className="btn btn-sm btn-alt-secondary me-2 d-lg-none" data-toggle="layout" data-action="sidebar_toggle">
            <i className="fa-solid fa-fw fa-bars"></i>
          </button>
        </div>

        <div className="d-flex align-items-center">
          <div className="dropdown d-inline-block ms-2" ref={userMenuRef}>
            <button
              type="button"
              className="btn btn-sm btn-alt-secondary d-flex align-items-center"
              id="page-header-user-dropdown"
              aria-haspopup="true"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              onMouseEnter={() => { }}
              onMouseLeave={() => { }}
            >
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm" style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                {initials}
              </div>
              <span className="d-none d-sm-inline-block ms-2 fw-semibold" style={{ color: '#ffffff', fontSize: '0.9rem' }}>{userName}</span>
              <i
                className="fa-solid fa-fw fa-angle-down d-none d-sm-inline-block ms-2 opacity-75"
                style={{ color: '#ffffff' }}
              ></i>
            </button>
            <div className="dropdown-menu dropdown-menu-md dropdown-menu-end p-0 border-0" aria-labelledby="page-header-user-dropdown" style={{ display: open ? 'block' : 'none' }}>
              <div className="p-3 text-center bg-body-light border-bottom rounded-top">
                <span className="img-avatar img-avatar48 img-avatar-thumb d-inline-flex align-items-center justify-content-center" style={{ backgroundColor: '#ff9800', color: '#fff', width: 48, height: 48, borderRadius: '50%', fontWeight: 700, fontSize: 18 }}>
                  {initials}
                </span>
                <p className="mt-2 mb-0 fw-medium">{userNom}</p>
                <p className="mb-0 text-muted fs-sm fw-medium">{userPrenoms}</p>
              </div>
              <div className="p-2"></div>
              <div role="separator" className="dropdown-divider m-0"></div>
              <a className="dropdown-item d-flex align-items-center justify-content-between" href="#" onClick={handleLogout}>
                <span className="fs-sm fw-medium">Déconnexion</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div id="page-header-loader" className="overlay-header bg-body-extra-light" style={{ backgroundColor: '#0d6efd', color: '#ffffff' }}>
        <div className="content-header">
          <div className="w-100 text-center">
            <i className="fa-solid fa-fw fa-circle-notch fa-spin"></i>
          </div>
        </div>
      </div>
    </header>
  )
}

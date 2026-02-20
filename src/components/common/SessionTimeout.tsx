import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../context/PermissionContext'

// Time in milliseconds (e.g., 30 minutes)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes

export default function SessionTimeout() {
    const navigate = useNavigate()
    const { clearPermissions } = usePermissions()
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleLogout = useCallback(() => {
        console.warn('[Session] Inactivity timeout reached. Logging out...')

        // Clear all auth data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh_token')
        localStorage.removeItem('user_role_id')
        localStorage.removeItem('user_role_name')
        localStorage.removeItem('user_permissions')
        localStorage.removeItem('user_is_admin')

        // Use context cleanup if available
        if (clearPermissions) {
            clearPermissions()
        }

        // Redirect to login
        navigate('/login', { replace: true })

        // Show a notification if Swal is available
        const ask = (window as any).Swal
        if (ask) {
            ask.fire({
                icon: 'info',
                title: 'Session expirée',
                text: 'Vous avez été déconnecté pour inactivité.',
                timer: 3000,
                showConfirmButton: false
            })
        }
    }, [navigate, clearPermissions])

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT)
    }, [handleLogout])

    useEffect(() => {
        // Events to listen for
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ]

        // Initialize timer
        resetTimer()

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer)
        })

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer)
            })
        }
    }, [resetTimer])

    return null // This component doesn't render anything
}

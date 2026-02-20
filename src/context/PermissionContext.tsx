import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { permissionApi } from '../api/permissionApi'
import { authService } from '../services/authService'

interface PermissionContextType {
    permissions: string[]
    loading: boolean
    isAdmin: boolean
    hasPermission: (permissionLabel: string) => boolean
    refreshPermissions: (roleId: string, roleName?: string, force?: boolean) => Promise<void>
    setAuthData: (data: { permissions: string[], isAdmin: boolean, roleId: string, roleName: string }) => void
    clearPermissions: () => void
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Synchronous initialization to prevent menu flicker/delay
    const [permissions, setPermissions] = useState<string[]>(() => {
        const saved = localStorage.getItem('user_permissions')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                return Array.isArray(parsed) ? parsed : []
            } catch (_) { return [] }
        }
        return []
    })

    const [isAdmin, setIsAdmin] = useState<boolean>(() => {
        const savedIsAdmin = localStorage.getItem('user_is_admin') === 'true'
        const roleId = localStorage.getItem('user_role_id')
        const roleName = localStorage.getItem('user_role_name') || ''

        return savedIsAdmin ||
            roleId === '5965a737-73dc-485b-877e-7f9dddd22f10' ||
            roleName.toLowerCase().includes('admin') ||
            roleName.toLowerCase().includes('administrateur')
    })

    const [loading, setLoading] = useState(false)

    const refreshPermissions = useCallback(async (roleIdArg: string | null = null, roleNameArg?: string, force: boolean = false) => {
        // If not forcing and we already have permissions, skip to avoid lag
        if (!force && permissions.length > 0 && !roleIdArg) {
            return;
        }

        setLoading(true)
        console.log('[Permissions] Starting refresh flow...')

        try {
            let userIdRole: string | null = roleIdArg
            let userRoleName: string | null = roleNameArg ?? null

            // Only fetch current user if we don't have role info
            if (!userIdRole) {
                try {
                    const currentUserRes = await authService.getCurrent()
                    const userPayload = currentUserRes?.data || currentUserRes
                    const u = userPayload?.data || userPayload || {}

                    userIdRole = u.roleId || u.RoleId || u.role?.id || u.Role?.Id
                    userRoleName = u.roleName || u.RoleName || u.role?.libelle || u.Role?.Libelle || u.role?.libelleRole

                    if (userIdRole) localStorage.setItem('user_role_id', userIdRole)
                    if (userRoleName) localStorage.setItem('user_role_name', userRoleName)
                } catch (authErr) {
                    console.warn('[Permissions] Failed to fetch current user:', authErr)
                }
            }

            const finalRoleId = userIdRole || localStorage.getItem('user_role_id')
            const finalRoleName = userRoleName || localStorage.getItem('user_role_name') || ''

            const isAdm = finalRoleId === '5965a737-73dc-485b-877e-7f9dddd22f10' ||
                finalRoleName.toLowerCase().includes('admin') ||
                finalRoleName.toLowerCase().includes('administrateur')

            setIsAdmin(isAdm)
            localStorage.setItem('user_is_admin', isAdm ? 'true' : 'false')

            if (!finalRoleId) {
                setLoading(false)
                return
            }

            if (!isAdm) {
                try {
                    // Check if we already have permissions in localStorage to avoid API call if not forced
                    const savedPerms = localStorage.getItem('user_permissions')
                    if (!force && savedPerms) {
                        const parsed = JSON.parse(savedPerms)
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setPermissions(parsed)
                            setLoading(false)
                            return
                        }
                    }

                    const permRes = await permissionApi.getByRoleId(finalRoleId)
                    if (permRes.isSuccess && Array.isArray(permRes.data)) {
                        const newPerms = permRes.data.map(p => p.libelle)
                        setPermissions(newPerms)
                        localStorage.setItem('user_permissions', JSON.stringify(newPerms))
                    }
                } catch (permErr: any) {
                    console.error('[Permissions] Error fetching permissions:', permErr?.message || permErr)
                }
            }
        } catch (fatal) {
            console.error('[Permissions] Fatal error:', fatal)
        } finally {
            setLoading(false)
        }
    }, [permissions.length])

    const setAuthData = useCallback((data: { permissions: string[], isAdmin: boolean, roleId: string, roleName: string }) => {
        setPermissions(data.permissions)
        setIsAdmin(data.isAdmin)
        localStorage.setItem('user_permissions', JSON.stringify(data.permissions))
        localStorage.setItem('user_is_admin', data.isAdmin ? 'true' : 'false')
        localStorage.setItem('user_role_id', data.roleId)
        localStorage.setItem('user_role_name', data.roleName)
    }, [])

    const clearPermissions = useCallback(() => {
        setPermissions([])
        setIsAdmin(false)
        localStorage.removeItem('user_permissions')
        localStorage.removeItem('user_role_id')
        localStorage.removeItem('user_role_name')
        localStorage.removeItem('user_is_admin')
        localStorage.removeItem('user_profile')
    }, [])

    const hasPermission = useCallback((permissionLabel: string) => {
        if (isAdmin) return true
        const normalize = (s: string) =>
            String(s || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ')
        const target = normalize(permissionLabel)
        return permissions.some(p => normalize(p) === target)
    }, [permissions, isAdmin])

    // Single check at mount - only fetch if data is missing
    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        const roleId = localStorage.getItem('user_role_id')
        const savedPermissions = localStorage.getItem('user_permissions')

        // Only refresh if logged in but missing permissions/roleId
        if (token && (!roleId || !savedPermissions)) {
            console.log('[Permissions] Missing data on mount, fetching...')
            refreshPermissions(null, undefined, true)
        }
    }, []) // Run only once on mount

    // Periodic refresh (less frequent) - only to keep permissions up-to-date in background
    useEffect(() => {
        const intervalId = setInterval(() => {
            const roleId = localStorage.getItem('user_role_id')
            const token = localStorage.getItem('auth_token')
            if (token && roleId) {
                refreshPermissions(roleId, undefined, false)
            }
        }, 300000) // 5 minutes
        return () => clearInterval(intervalId)
    }, [refreshPermissions])

    return (
        <PermissionContext.Provider value={{ permissions, loading, isAdmin, hasPermission, refreshPermissions, setAuthData, clearPermissions }}>
            {children}
        </PermissionContext.Provider>
    )
}

export const usePermissions = () => {
    const context = useContext(PermissionContext)
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionProvider')
    }
    return context
}

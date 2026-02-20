import api from '../api/apiClient'

export const permissionService = {
    list: () => api.get('/Permissions'),
    getByRoleId: (roleId: string) => api.get(`/RolePermissions/${roleId}`),
    addToRole: (roleId: string, permissionIds: string[]) =>
        api.post('/RolePermissions/add', { roleId, permissionIds }),
    removeFromRole: (roleId: string, permissionIds: string[]) =>
        api.post('/RolePermissions/delete', { roleId, permissionIds }),
}

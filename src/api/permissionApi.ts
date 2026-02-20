import api from './apiClient'

export type Permission = {
    id: string
    libelle: string
}

export type ApiResult<T> = {
    isSuccess: boolean
    message: string
    data: T
}

export const permissionApi = {
    async list() {
        const { data } = await api.get<ApiResult<Permission[]>>('/Permissions')
        return data
    },
    async getByRoleId(roleId: string) {
        const { data } = await api.get<ApiResult<Permission[]>>(`/RolePermissions/${roleId}`)
        return data
    },
    async addRolePermissions(payload: { roleId: string; permissionIds: string[] }) {
        const { data } = await api.post<ApiResult<string>>('/RolePermissions/add', payload)
        return data
    },
    async removeRolePermissions(payload: { roleId: string; permissionIds: string[] }) {
        const { data } = await api.post<ApiResult<string>>('/RolePermissions/delete', payload)
        return data
    }
}

import api from './apiClient'

export type CompteurCellule = {
    id?: number
    compteurId: number
    celluleId: number
    createdBy?: string
    updatedBy?: string
    deletedBy?: string
    compteur?: any
    cellule?: any
    createdAt?: string
    updatedAt?: string
    deletedAt?: string
    isArchive?: boolean
}

export type ApiResult<T> = {
    isSuccess: boolean
    message: string
    data: T
}

const BASE = '/CompteurCellule'

export const compteurCelluleApi = {
    async add(payload: Array<{ compteurId: number; celluleId: number; userId: string; createdBy: string }>) {
        const { data } = await api.post<ApiResult<CompteurCellule[]>>(`${BASE}/add`, payload)
        return data
    },

    async remove(payload: Array<{ compteurId: number; celluleId: number; userId: string; deletedBy: string }>) {
        const { data } = await api.delete<ApiResult<CompteurCellule[]>>(`${BASE}/delete`, { data: payload })
        return data
    },

    async getByCompteurId(id: number, userId: string) {
        const { data } = await api.get<ApiResult<CompteurCellule[]>>(`${BASE}/getCompteurCelluleByIdCompteur`, {
            params: { Id: id, UserId: userId }
        })
        return data
    }
}

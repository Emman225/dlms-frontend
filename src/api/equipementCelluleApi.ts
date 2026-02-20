import api from './apiClient'

export type EquipementCellule = {
    id?: number
    equipementId: number
    celluleId: number
    userId: string
    createdBy?: string
    updatedBy?: string
    deletedBy?: string
    equipement?: any
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

const BASE = '/EquipementCellule'

export const equipementCelluleApi = {
    // POST /api/EquipementCellule/add
    async add(payload: Array<{ equipementId: number; celluleId: number; userId: string; createdBy: string }>) {
        const { data } = await api.post<ApiResult<EquipementCellule[]>>(`${BASE}/add`, payload)
        return data
    },

    // DELETE /api/EquipementCellule/delete
    async remove(payload: Array<{ equipementId: number; celluleId: number; userId: string; deletedBy: string }>) {
        const { data } = await api.delete<ApiResult<EquipementCellule[]>>(`${BASE}/delete`, { data: payload })
        return data
    },

    // GET /api/EquipementCellule/getEquipementCelluleByIdEquipement?Id=...&UserId=...
    async getByEquipementId(id: number, userId: string) {
        const { data } = await api.get<ApiResult<EquipementCellule[]>>(`${BASE}/getEquipementCelluleByIdEquipement`, {
            params: { Id: id, UserId: userId }
        })
        return data
    }
}

import api from './apiClient'

export type CompteurEquipement = {
    compteurId: number
    equipementId: number
    createdBy: string
}

export type CompteurEquipementResponse = {
    isSuccess: boolean
    message: string
    data: {
        createdAt: string
        updatedAt: string
        deletedAt: string
        createdBy: string
        updatedBy: string
        deletedBy: string
        isArchive: boolean
        compteurId: number
        equipementId: number
    }
}

export const compteurEquipementApi = {
    associate: async (payload: CompteurEquipement[]) => {
        const { data } = await api.post<CompteurEquipementResponse>('/CompteurEquipement/add', payload)
        return data
    },
    getByIdCompteur: async (id: number | string, userId: string) => {
        const { data } = await api.get(`/CompteurEquipement/getCompteurEquipementByIdCompteur?Id=${id}&UserId=${userId}`)
        return data
    },
    remove: async (payload: { compteurId: number; equipementId: number; userId: string; deletedBy: string }[]) => {
        const { data } = await api.delete<CompteurEquipementResponse>('/CompteurEquipement/delete', { data: payload })
        return data
    }
}

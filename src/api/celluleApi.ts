import api from './apiClient'

export type Cellule = {
    id: number
    // numero: string // Removed
    libelle: string
    adresse: string
    posteId: number
    poste?: any
    type?: string
    valeurTension: number
    createdAt: string
    updatedAt: string | null
    deletedAt: string | null
    createdBy: string
    updatedBy: string
    deletedBy: string
    isArchive: boolean
}

export type ApiResult<T> = {
    isSuccess: boolean
    message: string
    data: T
}

const BASE = '/Cellule'

export const celluleApi = {
    // POST http://<API>/api/Cellule/add
    async add(payload: { libelle: string; adresse: string; posteId: number; type?: string; valeurTension: number; createdBy: string }) {
        const { data } = await api.post<ApiResult<Cellule>>(`${BASE}/add`, payload)
        return data
    },

    // POST http://<API>/api/Cellule/edit
    async edit(payload: { id: number; libelle: string; adresse: string; posteId: number; type?: string; valeurTension: number; updatedBy: string }) {
        const { data } = await api.put<ApiResult<Cellule>>(`${BASE}/edit`, payload)
        return data
    },

    // DELETE http://<API>/api/Cellule/delete
    async remove(payload: { id: number; deletedBy: string }) {
        const { data } = await api.delete<ApiResult<string>>(`${BASE}/delete`, { data: payload })
        return data
    },

    // GET http://<API>/api/Cellule/getCelluleById?IdCellule=...
    async getById(id: number) {
        const { data } = await api.get<ApiResult<Cellule | null>>(`${BASE}/getCelluleById`, { params: { IdCellule: id } })
        return data
    },
}

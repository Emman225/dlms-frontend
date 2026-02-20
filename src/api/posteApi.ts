import api from './apiClient'

export type Poste = {
  id: number
  numero: string
  libelle: string
  adresse: string
  equipements: any[]
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

const BASE = '/Poste'

export const posteApi = {
  // POST http://<API>/api/Poste/add
  async add(payload: { numero: string; libelle: string; adresse: string; createdBy: string }) {
    const { data } = await api.post<ApiResult<Poste>>(`${BASE}/add`, payload)
    return data
  },

  // POST http://<API>/api/Poste/edit
  async edit(payload: { id: number; numero: string; libelle: string; adresse: string; updatedBy: string }) {
    const { data } = await api.post<ApiResult<Poste>>(`${BASE}/edit`, payload)
    return data
  },

  // POST http://<API>/api/Poste/delete
  async remove(payload: { id: number; deletedBy: string }) {
    const { data } = await api.post<ApiResult<string>>(`${BASE}/delete`, payload)
    return data
  },

  // GET http://<API>/api/Poste/getPosteById?IdPoste=...
  async getById(id: number) {
    const { data } = await api.get<ApiResult<Poste | null>>(`${BASE}/getPosteById`, { params: { IdPoste: id } })
    return data
  },

  // If a list endpoint exists, we can add it here later (e.g., `${BASE}/all`)
}

import api from './apiClient'

export type Fabricant = {
  id: number
  libelle: string
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

const BASE = '/Fabricant'

export const fabricantApi = {
  // POST /Fabricant/add
  async add(payload: { libelle: string; createdBy: string }) {
    const { data } = await api.post<ApiResult<Fabricant>>(`${BASE}/add`, payload)
    return data
  },
  // POST /Fabricant/edit
  async edit(payload: { id: number; libelle: string; updatedBy: string }) {
    const { data } = await api.post<ApiResult<Fabricant>>(`${BASE}/edit`, payload)
    return data
  },
  // POST /Fabricant/delete
  async remove(payload: { id: number; deletedBy: string }) {
    const { data } = await api.post<ApiResult<string>>(`${BASE}/delete`, payload)
    return data
  },
  // GET /Fabricant/getFabricantById?Id=...
  async getById(id: number) {
    const { data } = await api.get<ApiResult<Fabricant>>(`${BASE}/getFabricantById`, { params: { Id: id } })
    return data
  },
}

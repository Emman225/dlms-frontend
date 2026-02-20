import api from './apiClient'

export type Role = {
  id: string
  libelle: string
  code: string
  description: string
}

export type ApiResult<T> = {
  isSuccess: boolean
  message: string
  data: T
}

const BASE = '/Roles'

export const roleApi = {
  async add(payload: { libelle: string; code: string; description: string }) {
    const { data } = await api.post<ApiResult<Role>>(`${BASE}/add`, payload)
    return data
  },
  async edit(payload: { id: string; libelle: string; code: string; description: string }) {
    const { data } = await api.post<ApiResult<Role>>(`${BASE}/edit`, payload)
    return data
  },
  async remove(payload: { id: string }) {
    const { data } = await api.post<ApiResult<string>>(`${BASE}/delete`, payload)
    return data
  },
  async getById(id: string) {
    const { data } = await api.get<ApiResult<Role>>(`${BASE}/getRoleById`, { params: { id } })
    return data
  },
}

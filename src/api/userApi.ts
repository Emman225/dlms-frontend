import api from './apiClient'

export type User = {
  id: string
  mobile: string
  email: string
  nom: string
  prenoms: string
  dateNaissance: string
  nomPrenoms?: string
  roleId: string
  role?: {
    id: string
    libelle: string
    code: string
    description: string
  }
  posteId?: number | null
  poste?: {
    id: number
    libelle: string
    numero: string
    adresse: string
  } | null
  isLocked?: boolean
  mustChangePassword?: boolean
}

export type ApiResult<T> = {
  isSuccess: boolean
  message: string
  data: T
}

const BASE = '/Users'

export const userApi = {
  async add(payload: { nom: string; prenoms: string; dateNaissance: string; email: string; mobile: string; roleId: string; posteId?: number | null }) {
    const { data } = await api.post<ApiResult<User>>(`${BASE}/add`, payload)
    return data
  },
  async edit(payload: { id: string; nom: string; prenoms: string; dateNaissance: string; email: string; mobile: string; roleId: string; posteId?: number | null }) {
    const { data } = await api.post<ApiResult<User>>(`${BASE}/edit`, payload)
    return data
  },
  async remove(payload: { id: string }) {
    const { data } = await api.post<ApiResult<string>>(`${BASE}/delete`, payload)
    return data
  },
  async getById(id: string) {
    const { data } = await api.get<ApiResult<User>>(`${BASE}/getuserbyId`, { params: { id } })
    return data
  },
  async unlock(id: string) {
    const { data } = await api.post<ApiResult<string>>(`${BASE}/dislockuseraccount`, { id })
    return data
  },
  async forgotPassword(email: string) {
    const { data } = await api.post<ApiResult<User>>(`${BASE}/forgot-password`, { email })
    return data
  },
}

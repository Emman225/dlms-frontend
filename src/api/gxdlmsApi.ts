import api from './apiClient'

export type ProfilDetailItem = {
  id: number
  codeObisId: number
  gxdlmsprofilgenericId: number
  value: string
  numeroCompteur: string
  dateEnr: string
  isArchive: boolean
  codeobis?: {
    id: number
    category: string
    code1: string
    value: string
    code2: string
    unit: string | null
  }
}

export type ApiResult<T> = {
  isSuccess: boolean
  message: string
  data: T
}

export const gxdlmsApi = {
  // GET /Gxdlmsprofilgeneric/profilgenericdetailByStatus?NumeroCompteur=...&GxdlmsprofilgenericId=...&DateEnr=...&UserId=...
  async profilDetailByStatus(params: {
    NumeroCompteur: string;
    GxdlmsprofilgenericId?: number;
    DateEnr?: string;
    UserId?: string;
  }) {
    const { data } = await api.get<ApiResult<ProfilDetailItem[]>>('/Gxdlmsprofilgeneric/profilgenericdetailByStatus', { params })
    return data
  },
  // POST /Gxdlmsprofilgeneric/profilgenericdetailByMultipleCriteria
  async profilDetailByMultipleCriteria(params: {
    numeroCompteurs?: string[]
    gxdlmsprofilgenericIds?: number[]
    codeobisIds?: number[]
    dateEnr?: string
    userId?: string
  }) {
    const { data } = await api.post<ApiResult<ProfilDetailItem[]>>('/Gxdlmsprofilgeneric/profilgenericdetailByMultipleCriteria', params)
    return data
  },
  // GET /Gxdlmsprofilgeneric/profilgenericEventsByStatus?NumeroCompteur=...
  async profilEventsByStatus(params: { numeroCompteur: string }) {
    const { data } = await api.get<ApiResult<ProfilDetailItem[]>>('/Gxdlmsprofilgeneric/profilgenericEventsByStatus', { params })
    return data
  },
}

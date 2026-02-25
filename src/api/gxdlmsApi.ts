import api from './apiClient'

export type EventInfo = {
  id: number
  category: string
  code1: string
  value: number
  bitMask: boolean
  code2: string
}

export type ProfilDetailItem = {
  id: number
  codeObisId: number
  gxdlmsprofilgenericId: number
  eventId: number | null
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
  gxdlmsprofilgeneric?: {
    id: number
    codeObisId: number
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
  event?: EventInfo | null
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
  // GET /Gxdlmsprofilgeneric/profilgenericdetailseventByStatus?NumeroCompteur=...&UserId=...
  async profilEventsByStatus(params: { numeroCompteur: string; UserId?: string }) {
    const { data } = await api.get<ApiResult<ProfilDetailItem[]>>('/Gxdlmsprofilgeneric/profilgenericdetailseventByStatus', { params })
    return data
  },
}

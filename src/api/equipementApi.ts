import api from './apiClient'

export type Equipement = {
  id: number
  numeroSerie: string
  libelle: string
  adresseIp: string
  type: string
  marque: string
  port: string
  serialPort: string
  datePremierePose: string
  datePoseActuelle: string
  posteId: number
  poste?: any
  celluleId: number
  cellule?: any
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

const BASE = '/Equipement'

export const equipementApi = {
  // POST /Equipement/add
  async add(payload: {
    numeroSerie: string
    libelle: string
    adresseIp: string
    type: string
    marque: string
    port: string
    serialPort: string
    datePremierePose: string
    datePoseActuelle: string
    posteId: number
    celluleId?: number
    createdBy: string
  }) {
    const { data } = await api.post<ApiResult<Equipement>>(`${BASE}/add`, payload)
    return data
  },

  // POST /Equipement/edit
  async edit(payload: {
    id: number
    numeroSerie: string
    libelle: string
    adresseIp: string
    type: string
    marque: string
    port: string
    serialPort: string
    datePremierePose: string
    datePoseActuelle: string
    posteId: number
    celluleId?: number
    updatedBy: string
  }) {
    const { data } = await api.post<ApiResult<Equipement>>(`${BASE}/edit`, payload)
    return data
  },

  // POST /Equipement/delete
  async remove(payload: { id: number; deletedBy: string }) {
    const { data } = await api.post<ApiResult<string>>(`${BASE}/delete`, payload)
    return data
  },

  // GET /Equipement/getEquipementById?Id=...
  async getById(id: number) {
    const { data } = await api.get<ApiResult<Equipement>>(`${BASE}/getEquipementById`, { params: { Id: id } })
    return data
  },
}

import api from './apiClient'

export type Poste = {
  id: number
  numero: string | null
  libelle: string
  adresse: string
  cellules: []
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
  createdBy: string
  updatedBy: string
  deletedBy: string
  isArchive: boolean
}

export type Cellule = {
  id: number
  type: string | null
  valeurTension: string
  libelle: string
  adresse: string
  posteId: number
  poste: Poste
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
  createdBy: string
  updatedBy: string
  deletedBy: string
  isArchive: boolean
}

export type Compteur = {
  id: number
  idCompteur: string
  numeroCompteur: string
  marqueCompteur: string
  datePremierePose: string
  datePoseActuelle: string
  energyProfilePeriod?: string | null
  crcFirmware?: string | null
  versionFirmware?: string | null
  versionFirmwareModem?: string | null
  adresseIp?: string | null
  phases?: string | null
  tarif?: string | null
  technicalProfilePeriod?: string | null
  timeDifference?: string | null
  dataConcentrator?: string | null
  typeOfTransport?: string | null
  typecompteur: string
  fabriquantId: number
  etatcontacteur: string
  port?: string | null
  cellules: Cellule[]
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

const BASE = '/Compteur'

export const compteurApi = {
  // GET /Compteur
  async list() {
    const { data } = await api.get<ApiResult<Compteur[]>>(BASE)
    return data
  },

  // POST /Compteur/add
  async add(payload: {
    idCompteur: string
    numeroCompteur: string
    marqueCompteur: string
    datePremierePose: string
    datePoseActuelle: string
    typecompteur: string
    fabriquantId: number
    etatcontacteur: string
    createdBy: string
  }) {
    const { data } = await api.post<ApiResult<Compteur>>(`${BASE}/add`, payload)
    return data
  },

  // POST /Compteur/edit
  async edit(payload: {
    id: number
    idCompteur: string
    numeroCompteur: string
    marqueCompteur: string
    datePremierePose: string
    datePoseActuelle: string
    typecompteur: string
    fabriquantId: number
    idposte?: number
    etatcontacteur: string
    updatedBy: string
  }) {
    // Prefer PUT per backend spec; fall back to POST if server only accepts POST
    try {
      const { data } = await api.put<ApiResult<Compteur>>(`${BASE}/edit`, payload)
      return data
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 405) {
        const { data } = await api.post<ApiResult<Compteur>>(`${BASE}/edit`, payload)
        return data
      }
      throw err
    }
  },

  // DELETE /Compteur/delete (body required)
  async remove(payload: { id: number; deletedBy: string }) {
    // Prefer DELETE with JSON body per backend spec; fall back to POST if server only accepts POST
    try {
      const { data } = await api.delete<ApiResult<string>>(`${BASE}/delete`, { data: payload })
      return data
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 405) {
        const { data } = await api.post<ApiResult<string>>(`${BASE}/delete`, payload)
        return data
      }
      throw err
    }
  },

  // GET /Compteur/getCompteurById?Id=...
  async getById(id: number) {
    const { data } = await api.get<ApiResult<Compteur>>(`${BASE}/getCompteurById`, { params: { Id: id } })
    return data
  },
}

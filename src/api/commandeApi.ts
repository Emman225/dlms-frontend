import api from './apiClient'

export type TypeCommande = {
  id: number
  libelletype: string
}

export type Commande = {
  id: number
  libellecommande: string
  dateexec: string | null
  datefin: string | null
  statut?: string
  idtype?: number
  numeroprofile: number
  nombreentree: number
  decalage: number
  datedebut: string | null
  dateexp: string | null
  typecommandeId?: number
  typecommande?: TypeCommande
  compteurId?: number[]
  createdAt?: string
  updatedAt?: string | null
  deletedAt?: string | null
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
  isArchive?: boolean
}

export type ApiResult<T> = {
  isSuccess: boolean
  message: string
  data: T
}

const BASE = '/Commande'

export const commandeApi = {
  async add(payload: {
    Libellecommande: string
    Dateexec?: string | null
    Datefin?: string | null
    Numeroprofile: number
    Nombreentree: number
    Decalage: number
    Datedebut?: string | null
    Dateexp?: string | null
    TypecommandeId: number
    CompteurId: number[]
    CreatedBy: string
  }) {
    const { data } = await api.post<ApiResult<Commande>>(`${BASE}/add`, {
      Libellecommande: payload.Libellecommande,
      Dateexec: payload.Dateexec,
      Datefin: payload.Datefin,
      Numeroprofile: payload.Numeroprofile,
      Nombreentree: payload.Nombreentree,
      Decalage: payload.Decalage,
      Datedebut: payload.Datedebut,
      Dateexp: payload.Dateexp,
      TypecommandeId: payload.TypecommandeId,
      CompteurId: payload.CompteurId,
      CreatedBy: payload.CreatedBy
    })
    return data
  },

  async edit(payload: {
    Id: number
    Libellecommande: string
    Dateexec?: string | null
    Datefin?: string | null
    Numeroprofile: number
    Nombreentree: number
    Decalage: number
    Datedebut?: string | null
    Dateexp?: string | null
    TypecommandeId: number
    CompteurId: number[]
    UpdatedBy: string
  }) {
    const { data } = await api.post<ApiResult<Commande>>(`${BASE}/edit`, {
      Id: payload.Id,
      Libellecommande: payload.Libellecommande,
      Dateexec: payload.Dateexec,
      Datefin: payload.Datefin,
      Numeroprofile: payload.Numeroprofile,
      Nombreentree: payload.Nombreentree,
      Decalage: payload.Decalage,
      Datedebut: payload.Datedebut,
      Dateexp: payload.Dateexp,
      TypecommandeId: payload.TypecommandeId,
      CompteurId: payload.CompteurId,
      UpdatedBy: payload.UpdatedBy
    })
    return data
  },

  async remove(payload: { Id: number; DeletedBy: string }) {
    const { data } = await api.delete<ApiResult<string>>(`${BASE}/delete`, {
      data: {
        Id: payload.Id,
        DeletedBy: payload.DeletedBy
      }
    })
    return data
  },

  async getById(id: number) {
    const { data } = await api.get<ApiResult<Commande>>(`${BASE}/getCommandeById`, { params: { Id: id } })
    return data
  },

  async execute(commandeId: number) {
    const { data } = await api.get<ApiResult<string>>(`/ReadObjectCommande/execute/${commandeId}`)
    return data
  },

  async getResultsByCommandeCompteurId(commandeCompteurId: number) {
    const { data } = await api.get<ApiResult<any[]>>(`/ResultatCommandeCompteur/getResultatsByCommandeCompteurId`, {
      params: { CommandeCompteurId: commandeCompteurId }
    })
    return data
  }
}

import api from '../api/apiClient.js'

export const compteurService = {
  list: () => api.get('/Compteur'),
  create: (data: unknown) => api.post('/Compteur/add', data),
  getById: (id: number | string) => api.get(`/Compteur/getCompteurById`, { params: { Id: id } }),
  edit: (id: number | string, data: unknown) => api.put(`/Compteur/edit`, { id: Number(id), ...(data as any) }),
  remove: (id: number | string, deletedBy?: string) => api.delete(`/Compteur/delete`, { data: { id: Number(id), deletedBy: String(deletedBy ?? '') } }),
}

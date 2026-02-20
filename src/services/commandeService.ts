import api from '../api/apiClient.js'

export const commandeService = {
  list: () => api.get('/Commande'),
  // GET /Commande/getCommandeById?Id=123
  getById: (id: number | string) => api.get('/Commande/getCommandeById', { params: { id } }),
  // POST /Commande/add
  add: (payload: any) => api.post('/Commande/add', payload),
  // POST /Commande/edit
  edit: (payload: any) => api.post('/Commande/edit', payload),
  // DELETE /Commande/delete with body
  remove: (payload: { id: number | string; deletedBy: string }) => api.delete('/Commande/delete', { data: payload }),
}

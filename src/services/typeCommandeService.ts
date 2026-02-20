import api from '../api/apiClient.js'

export const typeCommandeService = {
  list: () => api.get('/TypeCommande'),
}

import api from '../api/apiClient.js'

export const equipementService = {
  list: () => api.get('/Equipement'),
}

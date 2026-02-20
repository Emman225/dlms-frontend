import api from '../api/apiClient.js'

export const evenementService = {
  list: () => api.get('/Evenement'),
}

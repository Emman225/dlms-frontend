import api from '../api/apiClient.js'

export const posteService = {
  list: () => api.get('/Poste'),
}

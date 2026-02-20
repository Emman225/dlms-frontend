import api from '../api/apiClient.js'

export const fabricantService = {
  list: () => api.get('/Fabricant'),
}

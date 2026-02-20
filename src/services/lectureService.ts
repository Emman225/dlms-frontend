import api from '../api/apiClient.js'

export const lectureService = {
  list: (params?: Record<string, any>) => api.get('/lectureDonneesCompteur', { params }),
}
